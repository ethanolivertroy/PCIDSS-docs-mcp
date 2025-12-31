# PCI-DSS MCP Server - Setup Guide

Step-by-step guide to set up the PCI-DSS MCP server with PDF conversion.

## Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **Python** 3.9+ ([download](https://www.python.org/downloads/))
- **npm** (comes with Node.js)
- **pip** (comes with Python)

## Step 1: Clone and Install Node Dependencies

```bash
cd pcidss-docs-mcp
npm install
```

This installs:
- MCP SDK
- TypeScript compiler
- Zod for validation
- Other dependencies

## Step 2: Set Up Python Environment

### Option A: Using Virtual Environment (Recommended)

```bash
# Create virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate  # On macOS/Linux
# OR
.venv\Scripts\activate     # On Windows
```

### Option B: Global Installation

```bash
# Install directly (not recommended)
pip3 install -r requirements.txt
```

### Install Docling

```bash
pip install -r requirements.txt
```

This installs:
- `docling` - PDF parsing and extraction library
- `PyMuPDF` - PDF processing backend

**Verify installation:**
```bash
python3 -c "import docling; print(docling.__version__)"
```

## Step 3: Download PCI-DSS PDF and Accept License

### Important Legal Notice

The PCI-DSS documentation is copyrighted by PCI Security Standards Council.
The license agreement allows you to download and use the PDFs **for internal purposes only**.
You **cannot redistribute** the PDFs or converted data.

This tool teaches you how to convert PDFs for your own use, in compliance with the license.

### Download Steps

1. Visit the PCI Security Standards Council Document Library:
   https://www.pcisecuritystandards.org/document_library/

2. Search for "PCI DSS v4.0.1"

3. **Click the download link and READ the license agreement carefully**

4. Click "ACCEPT" to download (by accepting, you agree to use for internal purposes only)

5. Save the PDF to `data/pdfs/`:
   ```bash
   mv ~/Downloads/PCI-DSS-v4.0.1.pdf data/pdfs/
   ```

### Verify the PDF

```bash
ls -lh data/pdfs/PCI-DSS-v4_0_1.pdf
```

You should see a file around 4-5 MB.

## Step 4: Convert PDF to JSON/Markdown

You have two options for conversion:

### Option A: Quick Conversion (Recommended for experienced users)

```bash
npm run convert-pdfs
```

**Expected output:**
```
📄 PCI-DSS PDF to JSON/Markdown Converter

Checking Python dependencies...
✓ Found requirements.txt

Found 1 PDF file(s) to convert

Processing: PCI-DSS-v4.0.1.pdf
Converting data/pdfs/PCI-DSS-v4.0.1.pdf to JSON...
Converting data/pdfs/PCI-DSS-v4.0.1.pdf to Markdown...
✓ Created data/converted/requirements.json
✓ Created data/converted/requirements.md
✓ Created data/converted/metadata.json

✅ Conversion complete: 266 requirements extracted
```

### Option B: Interactive Tutorial (Recommended for first-time users)

If you want to understand how the conversion works with step-by-step guidance:

**Local Jupyter:**
```bash
# Install Jupyter
pip install jupyter

# Launch the tutorial notebook
jupyter notebook tutorials/convert-pdf-to-json.ipynb
```

**Google Colab (no local setup required):**
1. Visit: https://colab.research.google.com/github/ethanolivertroy/pcidss-docs-mcp/blob/main/tutorials/convert-pdf-to-json.ipynb
2. Upload your PCI-DSS PDF when prompted
3. Run all cells
4. Download the generated files

The notebook walks you through each step with explanations.

### What This Creates

The conversion generates three files in `data/converted/`:

- `requirements.json` (371 KB) - Structured data with 266 requirements
- `requirements.md` (2.2 MB) - Full searchable markdown
- `metadata.json` (260 B) - Conversion metadata (hash, timestamp)

**⚠️ These files are NOT included in the repository.** You must generate them yourself after accepting the PCI DSS license.

## Step 5: Build the MCP Server

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` folder.

## Step 6: Test the Server

```bash
npm run dev
```

**Expected output:**
```
Built index: XXX requirements in XXms
pcidss-docs-mcp server ready (index built in XXms)
```

Press `Ctrl+C` to stop.

## Step 7: Configure MCP Client

### For Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pcidss-docs": {
      "command": "node",
      "args": ["/absolute/path/to/pcidss-docs-mcp/dist/index.js"]
    }
  }
}
```

**Important:** Use the absolute path to `dist/index.js`

Restart Claude Desktop to load the server.

### For Claude Code

Edit `~/.claude.json`:

```json
{
  "mcpServers": {
    "pcidss-docs": {
      "command": "node",
      "args": ["/absolute/path/to/pcidss-docs-mcp/dist/index.js"]
    }
  }
}
```

## Step 8: Verify It Works

In Claude Desktop or Claude Code, try:

```
Use the health_check tool from pcidss-docs
```

You should see:
```json
{
  "ok": true,
  "documentVersion": "4.0.1",
  "indexedRequirements": XXX,
  "repoPath": "...",
  "errors": []
}
```

Then try:
```
List all principal PCI-DSS requirements (level 1)
```

## Troubleshooting

### "Python not found"

Set the Python path explicitly:
```bash
export PYTHON_PATH=/usr/local/bin/python3
npm run convert-pdfs
```

Or on Windows:
```cmd
set PYTHON_PATH=C:\Python39\python.exe
npm run convert-pdfs
```

### "docling not installed"

Make sure you activated the virtual environment:
```bash
source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### "No PDF files found"

Check the PDF is in the right location:
```bash
ls -la data/pdfs/
```

Should show your PDF file.

### "Conversion failed"

1. Check Python version: `python3 --version` (need 3.9+)
2. Check PDF is not corrupted: Try opening it
3. Check PDF is not encrypted/password protected
4. Reinstall dependencies:
   ```bash
   pip install --upgrade pip
   pip install --force-reinstall -r requirements.txt
   ```

### Server won't start

1. Rebuild: `npm run build`
2. Check data exists: `ls data/converted/requirements.json`
3. Check logs for specific errors

### MCP client can't connect

1. Verify absolute path in config
2. Restart Claude Desktop/Code
3. Check server starts: `npm run dev`
4. Check MCP logs (location varies by client)

## Next Steps

- Read the main README for available tools
- Try querying requirements: "Show me requirement 1.2.3"
- Explore the data structure in `data/converted/requirements.json`
- Check the implementation plan for upcoming features

## Development

### Re-convert PDF

If the PDF changes or you update the parser:
```bash
npm run convert-pdfs
```

The script will detect changes via hash comparison.

### Rebuild server

After code changes:
```bash
npm run build
npm run dev
```

### Clear cache

The index is cached for performance:
```bash
rm -rf ~/.cache/pcidss-docs/
npm run dev
```

## Getting Help

- Check README.md for architecture details
- Open an issue on GitHub
- Check FedRAMP MCP docs for similar patterns

## License

MIT - See LICENSE file
