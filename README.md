# Your Listener Max

Your Listener Max is an original Windows voice workflow assistant with a floating 3D presence, configurable calling names, dual activation, focused-app dictation, prompt cleanup, secure provider settings, safe workflow previews, and an MCP-ready connector hub.

## Download the launchable Windows build

The current packaged release is available from the [Your Listener Max v0.3.0 release page](https://github.com/EvanMenezes/your-listener/releases/tag/v0.3.0). The portable executable can run without an installer. Windows may display an unsigned-app warning because this open-source build is not code-signed; verify the release checksum shown by GitHub before running it.

## Run locally

Install Node.js 22 or newer, run `npm install`, then run `npm start`. To run the deterministic checks, use `npm test`. To create a portable Windows executable on Windows, use `npm run package`. The repository also includes a GitHub Actions workflow that installs native dependencies on a Windows runner, runs the smoke tests, packages the portable executable, and uploads the release artifact.

## Activation and dictation

The assistant supports the global `Ctrl + Win + Alt` hold-to-dictate mode on Windows. It also attempts to start continuous speech recognition after the user grants microphone permission. In idle speech mode, it listens for the configured calling name or aliases; after the calling name is detected, the remainder is treated as a command. The orb remains a manual start/stop fallback if speech recognition is unavailable or permission is denied.

When command mode is active, final speech is cleaned and inserted into the currently focused application through the native automation layer. The user can append “press enter” to request an Enter keystroke after insertion. Insertion failures are shown in the assistant window instead of being reported as success. If Chromium’s online Web Speech service returns a network or service-not-allowed error, the Windows build falls back to a native PowerShell `System.Speech` dictation process when that Windows component is available. The fallback keeps the assistant open and reports a clear error if the Windows speech component is unavailable.

## Personalization and secure settings

The settings window supports the display name, wake phrase, aliases, styles, dictionary terms, snippets, workflow rules, avatar/photo, and provider mode. Provider API keys are stored through Electron `safeStorage` and are not written to renderer localStorage. Existing legacy keys are migrated into encrypted storage when possible.

## Prompt quality and safety

Rough requests are normalized into a structured task with context, quality requirements, clarification questions, warnings, and confirmation rules. The layer does not invent missing recipients, dates, amounts, or permissions. Sensitive actions such as calling, messaging, submitting, purchasing, creating, editing, or deleting require an approved connector and explicit confirmation.

## Connectors and product boundary

The connector hub currently provides intent classification, connector matching, preview generation, permission checks, tool metadata, and audit helpers. Real Gmail, WhatsApp, Calendar, calling, or other private-service execution is not enabled until the user authorizes a real connector or supplies an approved API/MCP endpoint. The application must never fabricate a successful external action.

This is an original implementation targeting public user-facing voice-assistant outcomes. It does not copy private source code, private models, exact branding, or protected graphics from another product.

## Security notes

Do not commit API keys, connector credentials, local user photos, or generated build directories. The application uses context isolation, a restrictive content-security policy, URL validation, IPC allow-listing, encrypted provider storage, confirmation gates, and local audit history. No software can guarantee immunity from compromise; keep Windows, Node dependencies, and connector permissions up to date.
