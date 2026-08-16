const { app, BrowserWindow, ipcMain, shell, screen, clipboard, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { enhanceText } = require('./provider');
const connectorHub = require('./connector-hub');
const connectorRegistry = require('./connector-registry');
const workflowBuilder = require('./workflow-builder');
const secureStore = require('./secure-store');
const promptQuality = require('./prompt-quality');

let assistantWindow;
let settingsWindow;
let hook;
let automation;
let held = new Set();
let commandMode = false;
let activationTimer;
let activationSequence = 0;
let nativeSpeechProcess;
const nativeSpeechScript = [
  "$ErrorActionPreference = 'Stop'",
  "Add-Type -AssemblyName System.Speech",
  "$recognizer = New-Object System.Speech.Recognition.SpeechRecognitionEngine",
  "$recognizer.SetInputToDefaultAudioDevice()",
  "$recognizer.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))",
  "$recognizer.RecognizeCompleted.Add({ param($sender, $event); if ($event.Result -and $event.Result.Text) { Write-Output ('YL_RESULT:' + $event.Result.Text) } })",
  "Write-Output 'YL_READY'",
  "$recognizer.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)",
  "while ($true) { Start-Sleep -Seconds 1 }"
].join('; ');
function startNativeSpeech() {
  if (process.platform !== 'win32' || nativeSpeechProcess) return { ok: Boolean(nativeSpeechProcess), error: nativeSpeechProcess ? '' : 'Native Windows speech is only available in the Windows build.' };
  try {
    nativeSpeechProcess = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', nativeSpeechScript], { windowsHide: true });
    nativeSpeechProcess.stdout.setEncoding('utf8');
    nativeSpeechProcess.stdout.on('data', (chunk) => String(chunk).split(/\r?\n/).forEach((line) => {
      if (line === 'YL_READY') send('native-speech-ready');
      else if (line.startsWith('YL_RESULT:')) send('native-speech-result', line.slice(10).trim());
    }));
    nativeSpeechProcess.stderr.setEncoding('utf8');
    nativeSpeechProcess.stderr.on('data', (chunk) => send('native-speech-error', String(chunk).trim()));
    nativeSpeechProcess.on('error', (error) => { runtimeLog('native-speech-error', error); send('native-speech-error', error.message); nativeSpeechProcess = null; });
    nativeSpeechProcess.on('close', (code) => { if (code) send('native-speech-error', `Native speech stopped with code ${code}.`); nativeSpeechProcess = null; });
    return { ok: true };
  } catch (error) { runtimeLog('native-speech-start-error', error); return { ok: false, error: error.message }; }
}
function stopNativeSpeech() { try { nativeSpeechProcess?.kill(); } catch {} nativeSpeechProcess = null; return { ok: true }; }
async function startWindowsVoiceTyping() {
  if (process.platform !== 'win32') return { ok: false, error: 'Windows Voice Typing is only available in the Windows build.' };
  try {
    if (!automation) automation = require('@nut-tree-fork/nut-js');
    const { keyboard, Key } = automation;
    const winKey = Key.LeftWin || Key.LeftSuper || Key.LeftMeta;
    if (!winKey || !Key.H) throw new Error('Windows shortcut keys are unavailable in this build.');
    assistantWindow?.hide();
    await new Promise((resolve) => setTimeout(resolve, 250));
    await keyboard.pressKey(winKey, Key.H);
    await keyboard.releaseKey(winKey, Key.H);
    setTimeout(() => { try { assistantWindow?.showInactive(); } catch {} }, 700);
    return { ok: true };
  } catch (error) { try { assistantWindow?.showInactive(); } catch {} runtimeLog('windows-voice-typing-error', error); return { ok: false, error: error.message }; }
}
function runtimeLog(label, error) { try { const target = path.join(app.getPath('userData'), 'your-listener-runtime.log'); fs.appendFileSync(target, `[${new Date().toISOString()}] ${label}: ${error?.stack || error?.message || String(error)}\n`); } catch {} }
process.on('uncaughtException', (error) => runtimeLog('uncaughtException', error));
process.on('unhandledRejection', (error) => runtimeLog('unhandledRejection', error));

function send(channel, payload) {
  if (assistantWindow && !assistantWindow.isDestroyed()) assistantWindow.webContents.send(channel, payload);
}

function startNativeActivation() {
  if (process.platform !== 'win32') return;
  try {
    const { uIOhook, UiohookKey } = require('uiohook-napi');
    hook = { uIOhook, UiohookKey };
    const required = [UiohookKey.Ctrl, UiohookKey.A];
    const hasChord = () => required.every((key) => held.has(key));
    const schedule = (active) => {
      clearTimeout(activationTimer);
      const sequence = ++activationSequence;
      activationTimer = setTimeout(() => {
        if (sequence !== activationSequence) return;
        if (active && hasChord() && !commandMode) { commandMode = true; send('command-mode-start'); }
        if (!active && commandMode && !hasChord()) { commandMode = false; send('command-mode-stop'); }
      }, active ? 90 : 180);
    };
    uIOhook.on('keydown', ({ keycode }) => { held.add(keycode); if (hasChord()) schedule(true); });
    uIOhook.on('keyup', ({ keycode }) => { held.delete(keycode); if (!hasChord()) schedule(false); });
    uIOhook.start();
  } catch (error) { console.warn('Native activation unavailable:', error.message); }
}

async function insertText(text, pressEnter = false) {
  if (process.platform !== 'win32') return { ok: false, error: 'Focused-app insertion is available in the Windows build.' };
  try {
    if (!automation) automation = require('@nut-tree-fork/nut-js');
    const { keyboard, Key } = automation;
    clipboard.writeText(String(text || ''));
    await keyboard.pressKey(Key.LeftControl, Key.V);
    await keyboard.releaseKey(Key.LeftControl, Key.V);
    if (pressEnter) {
      await keyboard.pressKey(Key.Enter);
      await keyboard.releaseKey(Key.Enter);
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function createAssistant() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  assistantWindow = new BrowserWindow({
    width: 440,
    height: 720,
    x: Math.round((width - 440) / 2),
    y: Math.round((height - 720) / 2),
    minWidth: 380,
    minHeight: 580,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  assistantWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  assistantWindow.webContents.on('render-process-gone', (_event, details) => runtimeLog(`render-process-gone/${details.reason}`, details));
  assistantWindow.webContents.on('crashed', () => runtimeLog('renderer-crashed', 'The assistant renderer crashed.'));
  assistantWindow.once('ready-to-show', () => assistantWindow.show());
  assistantWindow.on('closed', () => { assistantWindow = null; });
  startNativeActivation();
}

function createSettings() {
  if (settingsWindow && !settingsWindow.isDestroyed()) return settingsWindow.focus();
  settingsWindow = new BrowserWindow({
    width: 560,
    height: 760,
    parent: assistantWindow,
    frame: false,
    backgroundColor: '#10131a',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const ownWindow = webContents.getURL().startsWith('file://');
    callback(ownWindow && permission === 'media');
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    const ownWindow = webContents.getURL().startsWith('file://');
    return ownWindow && permission === 'media';
  });
  createAssistant();
  ipcMain.handle('open-settings', createSettings);
  ipcMain.handle('open-url', async (_event, raw) => {
    try {
      if (typeof raw !== 'string' || raw.length > 2048) throw new Error('Invalid or oversized URL.');
      const url = new URL(raw);
      const host = url.hostname.toLowerCase();
      if (url.protocol !== 'https:' && !(url.protocol === 'http:' && (host === 'localhost' || host === '127.0.0.1'))) throw new Error('Only HTTPS URLs or local HTTP URLs are allowed.');
      if (url.username || url.password) throw new Error('URLs with embedded credentials are blocked.');
      await shell.openExternal(url.toString());
      return { ok: true };
    } catch (error) { return { ok: false, error: error.message }; }
  });
  ipcMain.handle('insert-text', (_event, data) => insertText(data?.text, Boolean(data?.pressEnter)));
  ipcMain.handle('enhance-text', (_event, data) => enhanceText(data || {}));
  ipcMain.handle('connector-route', (_event, data) => { const request=connectorHub.route(data?.text, data?.connectors || []); return { request, preview: connectorHub.preview(request), permission: connectorHub.canRun(request, data?.permissions || {}) }; });
  ipcMain.handle('connector-templates', () => connectorRegistry.BUILTIN_TEMPLATES);
  ipcMain.handle('connector-health', (_event, data) => connectorRegistry.health(data || {}));
  ipcMain.handle('connector-tools', (_event, data) => connectorRegistry.discoverTools(data?.connector || {}, data?.tools || []));
  ipcMain.handle('workflow-preview', (_event, data) => workflowBuilder.preview(data?.definition || '', data?.context || {}));
  ipcMain.handle('secure-set', (_event, data) => secureStore.setSecret(data?.name, data?.value));
  ipcMain.handle('secure-get', (_event, data) => secureStore.getSecret(data?.name));
  ipcMain.handle('secure-delete', (_event, data) => secureStore.deleteSecret(data?.name));
  ipcMain.handle('refine-prompt', (_event, data) => promptQuality.refine(data?.input, data?.context || {}));
  ipcMain.handle('native-speech-start', () => startNativeSpeech());
  ipcMain.handle('native-speech-stop', () => stopNativeSpeech());
  ipcMain.handle('windows-voice-typing', () => startWindowsVoiceTyping());
  ipcMain.on('close-window', (event) => BrowserWindow.fromWebContents(event.sender)?.close());
  ipcMain.on('minimize-window', (event) => BrowserWindow.fromWebContents(event.sender)?.minimize());
});

app.on('will-quit', () => { try { hook?.uIOhook?.stop(); } catch {} stopNativeSpeech(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });




