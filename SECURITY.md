# Security Policy

## Supported versions

Only the latest commit on `master` is actively supported for security updates.

## Reporting a vulnerability

If you discover a security vulnerability in Burnwise, please report it privately by emailing the maintainer at **security@burnwise.dev** (replace with your actual contact).

Please include:

- A description of the vulnerability
- Steps to reproduce
- Affected versions or components
- Suggested mitigation if you have one

We will respond within 7 days and work with you to coordinate a fix and disclosure.

## Security features

Burnwise is designed to be self-hosted. Keep these practices in mind:

- Change the default `INGEST_API_KEY` in production.
- Run the server behind HTTPS.
- Restrict network access to the proxy service.
- Encrypt or protect stored issue-tracker API tokens.