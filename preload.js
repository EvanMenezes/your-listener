const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('yourListener', {
  openSettings: () => ipcRenderer.invoke('open-settings'),
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
  insertText: (text, pressEnter = false) => ipcRenderer.invoke('insert-text', { text, pressEnter }),
  enhanceText: (payload) => ipcRenderer.invoke('enhance-text', payload),
  connectorRoute: (payload) => ipcRenderer.invoke('connector-route', payload),
  connectorTemplates: () => ipcRenderer.invoke('connector-templates'),
  connectorHealth: (payload) => ipcRenderer.invoke('connector-health', payload),
  connectorTools: (payload) => ipcRenderer.invoke('connector-tools', payload),
  workflowPreview: (payload) => ipcRenderer.invoke('workflow-preview', payload),
  secureSet: (payload) => ipcRenderer.invoke('secure-set', payload),
  secureGet: (payload) => ipcRenderer.invoke('secure-get', payload),
  secureDelete: (payload) => ipcRenderer.invoke('secure-delete', payload),
  refinePrompt: (payload) => ipcRenderer.invoke('refine-prompt', payload),
  nativeSpeechStart: () => ipcRenderer.invoke('native-speech-start'),
  nativeSpeechStop: () => ipcRenderer.invoke('native-speech-stop'),
  windowsVoiceTyping: () => ipcRenderer.invoke('windows-voice-typing'),
  onNativeSpeechReady: (callback) => ipcRenderer.on('native-speech-ready', callback),
  onNativeSpeechResult: (callback) => ipcRenderer.on('native-speech-result', (_event, text) => callback(text)),
  onNativeSpeechError: (callback) => ipcRenderer.on('native-speech-error', (_event, error) => callback(error)),
  onCommandModeStart: (callback) => ipcRenderer.on('command-mode-start', callback),
  onCommandModeStop: (callback) => ipcRenderer.on('command-mode-stop', callback),
  closeWindow: () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window')
});




