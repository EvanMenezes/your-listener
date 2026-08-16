/* Your Listener Max settings: activation, writing preferences, avatar, and secure provider credentials. */
const $ = (id) => document.getElementById(id);
const defaults = { providerMode: 'hybrid', providerEndpoint: '', name: 'Your Listener', wakePhrase: 'your listener', aliases: [], alternativeShortcut: 'Alt + Space', style: 'natural', dictionary: [], snippet: { trigger: '', text: '' }, workflow: '', avatar: 'YL', avatarImage: '' };
const fallback = { ...defaults };
let current = { ...defaults, ...(read('yourListenerSettings') || {}) };
let avatar = current.avatar || 'YL';
let image = current.avatarImage || '';

function read(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
function writePublicSettings(value) { localStorage.setItem('yourListenerSettings', JSON.stringify(value)); }
function setValue(id, value) { const node = $(id); if (node) node.value = value ?? ''; }

async function loadSecureProviderKey() {
  try {
    const stored = await window.yourListener.secureGet({ name: 'providerKey' });
    const legacyKey = current.providerKey || '';
    if (!stored?.value && legacyKey) await window.yourListener.secureSet({ name: 'providerKey', value: legacyKey });
    if (legacyKey) { delete current.providerKey; writePublicSettings(current); }
    setValue('providerKey', stored?.value || legacyKey || '');
  } catch (error) {
    $('saved').textContent = `Secure storage unavailable: ${error.message}`;
  }
}

function fill() {
  setValue('name', current.name || fallback.name);
  setValue('wake', current.wakePhrase || fallback.wakePhrase);
  setValue('aliases', (current.aliases || []).join(', '));
  setValue('shortcut', current.alternativeShortcut || fallback.alternativeShortcut);
  setValue('style', current.style || 'natural');
  setValue('dictionary', (current.dictionary || []).join(', '));
  setValue('snippetTrigger', current.snippet?.trigger || '');
  setValue('snippetText', current.snippet?.text || '');
  setValue('workflow', current.workflow || '');
  setValue('providerMode', current.providerMode || 'hybrid');
  setValue('providerEndpoint', current.providerEndpoint || '');
  document.querySelectorAll('.choice').forEach((button) => button.classList.toggle('selected', button.dataset.avatar === avatar));
  if (image) { $('preview').src = image; $('preview').style.display = 'block'; }
}

document.querySelectorAll('.choice').forEach((button) => button.onclick = () => {
  avatar = button.dataset.avatar;
  image = '';
  $('preview').style.display = 'none';
  document.querySelectorAll('.choice').forEach((item) => item.classList.toggle('selected', item === button));
});

$('photo').onchange = () => {
  const file = $('photo').files?.[0];
  if (!file || file.size > 2000000) return;
  const reader = new FileReader();
  reader.onload = () => { image = reader.result; $('preview').src = image; $('preview').style.display = 'block'; document.querySelectorAll('.choice').forEach((item) => item.classList.remove('selected')); };
  reader.readAsDataURL(file);
};
$('remove').onclick = () => { image = ''; $('photo').value = ''; $('preview').style.display = 'none'; };

$('save').onclick = async () => {
  const providerKey = $('providerKey').value;
  try {
    if (providerKey) await window.yourListener.secureSet({ name: 'providerKey', value: providerKey });
    else await window.yourListener.secureDelete({ name: 'providerKey' });
    const value = {
      providerMode: $('providerMode').value,
      providerEndpoint: $('providerEndpoint').value.trim(),
      name: $('name').value.trim() || fallback.name,
      wakePhrase: $('wake').value.trim().toLowerCase() || fallback.wakePhrase,
      aliases: $('aliases').value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean).slice(0, 12),
      alternativeShortcut: $('shortcut').value.trim() || fallback.alternativeShortcut,
      style: $('style').value,
      dictionary: $('dictionary').value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 50),
      snippet: { trigger: $('snippetTrigger').value.trim(), text: $('snippetText').value.trim() },
      workflow: $('workflow').value.trim(),
      avatar,
      avatarImage: image,
    };
    writePublicSettings(value);
    $('saved').textContent = 'Saved securely.';
    setTimeout(() => window.yourListener.closeWindow(), 700);
  } catch (error) {
    $('saved').textContent = `Could not save securely: ${error.message}`;
  }
};
$('cancel').onclick = () => window.yourListener.closeWindow();
$('close').onclick = () => window.yourListener.closeWindow();
fill();
loadSecureProviderKey();
