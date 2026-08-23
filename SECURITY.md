# Security Policy

## What this app can access

Buddy is a local desktop assistant. Depending on enabled features it may:

- Capture screen, selected regions, or system audio
- Read clipboard and selected text in other apps
- Send keystrokes and mouse events (Remote Pad, agent / computer-use)
- Store API keys in the OS credential store (keytar) or local settings
- Open a LAN WebSocket (default port **8765**) for the Android companion

That access is intentional. Do not add silent capture, hidden keylogging, or telemetry that ships user content off-device without an obvious setting.

## Reporting a vulnerability

**Do not** open a public GitHub issue for security bugs.

Use [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) on this repository.

Include:

- What the issue is and how to reproduce it
- Affected OS and Buddy version (or commit)
- Whether Remote Pad / LAN ports are involved

We will acknowledge the report and work on a fix before any public disclosure.

## Secrets

- Never commit `.env`, `.env.*` (except `.env.example`), `*.pem`, `*.key`, `*.jks`, or keystore passwords
- Production publish credentials (R2, Apple notarization, Android signing) belong in GitHub Actions **secrets**, not in the repo
- Rotate any key that was ever pasted into a committed file
