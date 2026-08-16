const SAFE_READ_ACTIONS = new Set(['list_tools','search','open_url','read','draft']);
const SENSITIVE_ACTIONS = new Set(['send','call','submit','delete','purchase','edit','create']);

function normalize(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function classify(text) {
  const value = normalize(text);
  if (/\b(call|phone|ring)\b/.test(value)) return { kind: 'call', sensitivity: 'sensitive' };
  if (/\b(send|message|email|text|whatsapp|slack)\b/.test(value)) return { kind: 'send', sensitivity: 'sensitive' };
  if (/\b(delete|remove|cancel)\b/.test(value)) return { kind: 'delete', sensitivity: 'sensitive' };
  if (/\b(create|add|book|schedule|make)\b/.test(value)) return { kind: 'create', sensitivity: 'sensitive' };
  if (/\b(open|show|find|search|list|check|read)\b/.test(value)) return { kind: 'read', sensitivity: 'safe' };
  return { kind: 'unknown', sensitivity: 'unknown' };
}

function route(text, connectors = []) {
  const intent = classify(text);
  const value = normalize(text);
  const lowerNames = connectors.map(c => ({ ...c, normalized: normalize(c.name || c.id) }));
  const connector = lowerNames.find(c => c.normalized && value.includes(c.normalized)) || null;
  return { text, intent, connector, requiresConfirmation: intent.sensitivity === 'sensitive', status: connector ? 'routable' : 'needs_connector' };
}

function preview(request) {
  return { title: request.requiresConfirmation ? 'Confirmation required' : 'Ready to run', summary: request.text, connector: request.connector?.name || 'No connector selected', action: request.intent.kind, requiresConfirmation: request.requiresConfirmation };
}

function canRun(request, permissions = {}) {
  if (request.status !== 'routable') return { ok: false, reason: 'No approved connector matches this request.' };
  if (request.requiresConfirmation && !permissions.confirmed) return { ok: false, reason: 'This action requires explicit confirmation.' };
  if (permissions.allowed === false) return { ok: false, reason: 'This connector is disabled by the user.' };
  return { ok: true };
}

function audit(entry, existing = []) {
  return [{ ...entry, at: new Date().toISOString() }, ...existing].slice(0, 200);
}

module.exports = { SAFE_READ_ACTIONS, SENSITIVE_ACTIONS, normalize, classify, route, preview, canRun, audit };
