# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue. Instead, please email esproxyyt@gmail.com with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact

We will respond within 48 hours and work with you to address the issue before making it public.

## Security Best Practices

This extension follows the principle of least privilege:
- Only requests `activeTab` permission (access to active tab when used)
- No background data collection
- All data stays local (uses `chrome.storage.local`)
- No external network requests
