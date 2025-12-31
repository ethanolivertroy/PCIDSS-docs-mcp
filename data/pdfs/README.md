# PCI-DSS PDF Files

This directory is for PCI-DSS PDF documents that you download and license from PCI Security Standards Council.

## ⚠️ Important Legal Information

**You CANNOT use PDFs included in this repository** (if any were present by mistake).

You MUST:
1. Download PDFs directly from the official source
2. Accept the PCI DSS License Agreement yourself
3. Use the PDFs for internal purposes only
4. NOT redistribute PDFs or converted data

## Download PCI-DSS v4.0.1

### Step 1: Visit Official Source

https://www.pcisecuritystandards.org/document_library/

### Step 2: Accept License Agreement

Click the download link and READ the license carefully. Key terms:
- **Read and Copy License**: "for internal purposes only"
- **No Sublicensing**: "Licensee shall not sublicense any Standard"
- **No Redistribution**: You cannot share the PDF with others who haven't accepted the license

### Step 3: Download

After accepting, download:
- **PCI-DSS v4.0.1** (March 2024) - Required
- PCI-DSS v4.0 Summary of Changes (optional) - For version comparison

### Step 4: Place in This Directory

```bash
mv ~/Downloads/PCI-DSS-v4_0_1.pdf ./data/pdfs/
```

### Step 5: Convert to JSON

```bash
# From repo root
npm run convert-pdfs

# Or use the Jupyter notebook tutorial
jupyter notebook tutorials/convert-pdf-to-json.ipynb

# Or use Google Colab (no local setup required)
# Visit: https://colab.research.google.com/github/ethanolivertroy/pcidss-docs-mcp/blob/main/tutorials/convert-pdf-to-json.ipynb
```

## Expected Files

After downloading, this directory should contain:

- `PCI-DSS-v4_0_1.pdf` - Main PCI-DSS v4.0.1 standard (4-5 MB)
- `README.md` - This file (committed to git)

**The PDF file is excluded from git** via `.gitignore` to ensure license compliance.

## Why This Approach?

This tool provides the **software** to work with PCI-DSS documentation.
You provide the **data** by licensing it yourself from PCI SSC.

This separation ensures:
- ✅ Compliance with PCI DSS license terms
- ✅ Users accept license agreement directly
- ✅ No copyright infringement concerns
- ✅ Open source software distribution

Think of it like:
- youtube-dl (tool) vs YouTube videos (data)
- OCR software (tool) vs scanned documents (data)
- This MCP server (tool) vs PCI-DSS PDFs (data)

## Legal Analysis

### What the PCI DSS License Allows

From Section I "Read and Copy License":
- ✅ Download for study purposes
- ✅ Copy **for internal purposes only**
- ✅ Share with your employees

### What the PCI DSS License Prohibits

From Section III.1.1 "No Sublicensing":
- ❌ Sublicense or redistribute the Standard
- ❌ Share with people who haven't accepted the license
- ❌ Include in public repositories or distributions

### Why Our Approach Is Compliant

**What we distribute (legal):**
- ✅ Open source conversion tools (MIT licensed)
- ✅ MCP server code (our work, not PCI SSC's)
- ✅ Educational tutorials showing how to convert

**What we DON'T distribute (would be illegal):**
- ❌ PCI-DSS PDF files
- ❌ Converted JSON/Markdown from PCI DSS content
- ❌ Any copyrighted PCI SSC material

**What you do (legal under your license):**
- ✅ Download PDF after accepting license
- ✅ Convert PDF for your internal use
- ✅ Use MCP server with your converted data
- ✅ Keep everything internal to your organization

## Troubleshooting

### "Where do I get the PDF?"

**Only from:** https://www.pcisecuritystandards.org/document_library/

Do NOT use PDFs from:
- Third-party websites
- File sharing services
- Email attachments from others
- This repository (if mistakenly included)

You must download directly from PCI SSC and accept the license yourself.

### "Can I share my converted JSON with teammates?"

**Within your organization:** Yes, if they're your employees and it's for internal purposes.

**Outside your organization:** No. The license restricts use to "internal purposes only."

**On GitHub/public repos:** No. This would violate the redistribution prohibition.

### "Can I share the JSON with a consultant/auditor?"

This is a gray area. The license allows sharing with "employees." Consultants typically need to license the material themselves through PCI SSC. When in doubt, have them download and accept the license directly.

### "Can I use this for my company's compliance program?"

**Yes!** The license explicitly allows "internal purposes," which includes:
- Compliance programs
- Internal audits
- Security assessments
- Training materials
- Process documentation

As long as it stays within your organization and you accepted the license, you're compliant.

### "Can I contribute to this open source project?"

**Absolutely!** Contribute:
- ✅ Code improvements
- ✅ Bug fixes
- ✅ Documentation
- ✅ Feature requests
- ✅ Issues and discussions

Do NOT contribute:
- ❌ PCI-DSS PDF files
- ❌ Converted JSON/Markdown data
- ❌ Copy-pasted PCI DSS content

Keep the tool (code) separate from the data (PCI DSS content).

### "What if PCI SSC changes the license?"

We monitor the license terms. If PCI SSC changes their license in a way that affects this tool, we'll update our approach accordingly. The current implementation is based on the license as of January 2025.

### "Is this tool officially endorsed by PCI SSC?"

**No.** This is an independent open source project. It is not affiliated with, endorsed by, or sponsored by PCI Security Standards Council.

We respect PCI SSC's copyrights and license terms. This tool helps you work with content you've legally licensed from them.

## For More Information

- **PCI SSC Document Library**: https://www.pcisecuritystandards.org/document_library/
- **License Questions**: Contact PCI SSC directly
- **Tool Questions**: Open a GitHub issue (don't share PCI DSS content)

## License

**This README and conversion tools:** MIT License (see LICENSE file)

**PCI-DSS PDF content:** Copyrighted by PCI Security Standards Council, licensed to you under their terms
