---
name: Missing Data / Conversion Issue
about: Help with PDF conversion or missing requirements.json
title: '[DATA] '
labels: 'documentation, help wanted'
assignees: ''
---

## Before Opening This Issue

This MCP server does NOT include PCI-DSS data. You must convert it yourself.

Have you:
- [ ] Downloaded PCI-DSS v4.0.1 from https://www.pcisecuritystandards.org/document_library/
- [ ] Accepted the PCI DSS License Agreement
- [ ] Placed the PDF in `data/pdfs/PCI-DSS-v4_0_1.pdf`
- [ ] Run `npm run convert-pdfs` OR used the Jupyter notebook tutorial
- [ ] Checked the troubleshooting section in SETUP.md
- [ ] Reviewed data/pdfs/README.md for legal requirements

If you've done all of the above and still have issues, please provide:

## System Information

- Operating System:
- Node.js version: (`node --version`)
- Python version: (`python3 --version`)
- npm version: (`npm --version`)
- Running in Colab or locally?

## Error Message

```
[Paste the full error message here]
```

## Steps You've Tried

1.
2.
3.

## Expected Behavior

What did you expect to happen?

## Actual Behavior

What actually happened?

## Additional Context

- Did the PDF download successfully from PCI SSC?
- Can you see the PDF file when you run `ls -la data/pdfs/`?
- Did Python dependencies install without errors?
- Are you behind a corporate proxy or firewall?
