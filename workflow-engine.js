function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseRule(rule) {
  const match = String(rule || '').match(/^\s*when\s+i\s+say\s+(.+?)\s*(?:→|->)\s*(.+)\s*$/i);
  if (!match) return null;
  return { trigger: normalize(match[1]), action: match[2].trim() };
}

function matchWorkflow(rule, command) {
  const parsed = parseRule(rule);
  if (!parsed) return null;
  const spoken = normalize(command);
  return spoken === parsed.trigger || spoken.startsWith(`${parsed.trigger} `) ? parsed : null;
}

module.exports = { normalize, parseRule, matchWorkflow };
