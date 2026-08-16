const assert = require('assert');
const { refine } = require('./prompt-quality');
const hub = require('./connector-hub');
const { enhanceText } = require('./provider');

(async () => {
  const empty = refine('');
  assert.equal(empty.ok, false);
  assert.ok(empty.questions.length);

  const send = refine('send a message');
  assert.equal(send.needsConfirmation, true);
  assert.ok(send.questions.length);

  const clear = refine('draft a project brief for the design team', { app: 'Notepad' });
  assert.equal(clear.ok, true);
  assert.equal(clear.questions.length, 0);

  const routed = hub.route('send an email with Gmail', [{ id: 'gmail', name: 'Gmail' }]);
  assert.equal(routed.status, 'routable');
  assert.equal(hub.canRun(routed, { confirmed: false }).ok, false);
  assert.equal(hub.canRun(routed, { confirmed: true }).ok, true);

  const local = await enhanceText({ mode: 'local', text: 'um hello   world .' });
  assert.equal(local.provider, 'local');
  assert.equal(local.text, 'hello world.');

  console.log('SMOKE_TESTS_OK');
})();
