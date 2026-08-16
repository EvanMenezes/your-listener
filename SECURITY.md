# Security Policy

Your Listener uses Electron isolation, a restricted Content Security Policy, validated IPC bridges, HTTPS-only external navigation except local development URLs, encrypted Windows credential storage through Electron safeStorage, connector permissions, explicit confirmation for sensitive actions, and local audit records.

## Credential rules

Do not commit API keys, access tokens, private keys, user photos, or connector credentials. Configure secrets through a local protected-storage flow. The public repository intentionally contains no live credentials.

## Sensitive actions

Calls, messages, form submissions, purchases, record creation, edits, and deletions must show a preview and require explicit confirmation.

## Production release

Before public production distribution, build on Windows with native dependencies, sign the executable, enable signed auto-updates, review dependencies, and run an independent security assessment. No software can be guaranteed impossible to hack.

## Reporting

For a suspected vulnerability, do not post credentials or exploit details publicly. Contact the repository owner privately through GitHub security channels.
