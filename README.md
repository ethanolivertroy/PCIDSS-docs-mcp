# PCI-DSS Docs MCP Server

[![Open Tutorial in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/ethanolivertroy/pcidss-docs-mcp/blob/main/tutorials/convert-pdf-to-json.ipynb)

Model Context Protocol (MCP) server for exploring PCI-DSS v4.0 compliance documentation.

> **⚠️ LEGAL NOTICE**: This tool does NOT include PCI DSS content. You must:
> 1. Download PCI-DSS PDFs from [PCI Security Standards Council](https://www.pcisecuritystandards.org/document_library/)
> 2. Accept the PCI DSS License Agreement (for internal use only)
> 3. Convert PDFs locally using the included conversion tools
> 4. NOT redistribute converted data
>
> This MCP server provides the **tools** to work with PCI-DSS documentation you've licensed.
> See [tutorials/convert-pdf-to-json.ipynb](tutorials/convert-pdf-to-json.ipynb) for step-by-step conversion guide.

## What This Tool Provides

**Included:**
- ✅ 15 MCP tools for querying PCI-DSS requirements
- ✅ Full-text search with v3.2.1 → v4.0.1 synonym expansion
- ✅ Control mappings to NIST 800-53, ISO 27001, CIS, FedRAMP, SOC2
- ✅ Gap analysis and evidence collection guidance
- ✅ PDF to JSON conversion tools (Python + TypeScript)
- ✅ Jupyter notebook tutorial for conversion

**Not Included (You Provide):**
- ❌ PCI-DSS PDF files (download from PCI SSC)
- ❌ Converted JSON/Markdown data (generate locally)

This separation ensures compliance with PCI DSS licensing restrictions.

## Features

- **15 MCP tools** for requirement lookup, search, and assessment
- **266 PCI-DSS v4.0.1 requirements** indexed with full hierarchy
- **Multi-framework control mapping** (NIST-800-53, ISO-27001, CIS, FedRAMP, SOC2)
- **v3.2.1 → v4.0.1 migration support** with version comparison
- **Evidence collection guidance** for audit preparation
- **Full-text search** with automatic v3.2.1 terminology translation
- **Fast startup** (~30ms with cached index)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/ethanolivertroy/pcidss-docs-mcp.git
cd pcidss-docs-mcp
npm install
```

### 2. Obtain PCI-DSS PDF

1. Visit https://www.pcisecuritystandards.org/document_library/
2. **Accept the license agreement** (required for legal use)
3. Download **PCI-DSS v4.0.1** PDF (March 2024)
4. Place in `data/pdfs/PCI-DSS-v4_0_1.pdf`

### 3. Convert PDF to JSON

**Option A: Quick conversion**
```bash
npm run convert-pdfs
```

**Option B: Step-by-step tutorial (Recommended)**
```bash
# Open the Jupyter notebook tutorial
jupyter notebook tutorials/convert-pdf-to-json.ipynb

# Or use Google Colab (no local setup required)
# Open: https://colab.research.google.com/github/ethanolivertroy/pcidss-docs-mcp/blob/main/tutorials/convert-pdf-to-json.ipynb
```

The tutorial walks you through:
- Installing dependencies
- Running conversion
- Validating output
- Troubleshooting common issues

### 4. Build and Start

```bash
npm run build
npm run dev
```

You should see: `✅ pcidss-docs-mcp server ready (index built in XXms)`

## Usage

### With Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

### With Claude Code

Add to `~/.claude.json`:

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

### Development

```bash
npm run dev
```

## Available Tools

### Core Tools

### 1. list_requirements

List PCI-DSS requirements with optional filtering.

Parameters:
- `level` (optional): Filter by hierarchy level (1, 2, or 3)
- `parentId` (optional): Filter by parent requirement ID
- `newInV4` (optional): Filter for new requirements in v4.0
- `changedFromV3` (optional): Filter for changed requirements from v3.2.1
- `applicability` (optional): Filter by applicability (e.g., "Service Providers")
- `limit` (default: 20): Number of results to return
- `offset` (default: 0): Pagination offset

Example:
```json
{
  "level": 1,
  "limit": 10
}
```

### 2. get_requirement

Get full details for a specific PCI-DSS requirement.

Parameters:
- `id` (required): Requirement ID (e.g., "1", "1.1", "1.2.3")

Returns:
- Full requirement details
- Child requirements (if any)
- Parent requirement (if applicable)

Example:
```json
{
  "id": "1.2"
}
```

### 3. health_check

Check the health and status of the MCP server.

Returns:
- Server status
- Document version
- Number of indexed requirements
- Repository path
- Any errors

### Search & Assessment Tools

### 4. search_requirements

Full-text search across all PCI-DSS requirements.

Parameters:
- `query` (required): Search query
- `limit` (default: 20): Maximum results to return
- `includeGuidance` (default: false): Include full guidance text

Example:
```json
{
  "query": "firewall",
  "limit": 10
}
```

### 5. search_markdown

Search the full PCI-DSS markdown documentation for guidance, purpose statements, and examples.

Parameters:
- `query` (required): Search query
- `limit` (default: 10): Maximum results
- `contextLines` (default: 2): Context lines before/after match

Example:
```json
{
  "query": "Good Practice",
  "contextLines": 3
}
```

### 6. get_testing_procedures

Get all testing procedures for a specific requirement.

Parameters:
- `requirementId` (required): Requirement ID

Example:
```json
{
  "requirementId": "1.2.3"
}
```

### 7. get_customized_approach

Get the Customized Approach objective for a requirement (v4.0 feature).

Parameters:
- `requirementId` (required): Requirement ID

Example:
```json
{
  "requirementId": "1.2.1"
}
```

### 8. get_compliance_checklist

Generate a compliance checklist for assessment planning.

Parameters:
- `requirementId` (optional): Scope to specific requirement
- `level` (optional): Filter by hierarchy level (1-4)
- `includeChildren` (default: true): Include child requirements

Example:
```json
{
  "requirementId": "1",
  "includeChildren": true
}
```

### Control Mapping Tools

### 9. list_control_mappings

List all PCI-DSS to security framework control mappings.

Parameters:
- `framework` (default: "all"): Filter by framework (NIST-800-53, ISO-27001, FedRAMP, CIS, SOC2, or "all")
- `requirementId` (optional): Filter by PCI-DSS requirement ID

Example:
```json
{
  "framework": "NIST-800-53"
}
```

### 10. map_to_nist

Map a PCI-DSS requirement to NIST 800-53 Rev. 5 controls.

Parameters:
- `requirementId` (required): PCI-DSS requirement ID

Example:
```json
{
  "requirementId": "10"
}
```

### 11. map_to_framework

Map a PCI-DSS requirement to any supported security framework.

Parameters:
- `requirementId` (required): PCI-DSS requirement ID
- `framework` (required): Target framework (NIST-800-53, ISO-27001, FedRAMP, CIS, SOC2)

Example:
```json
{
  "requirementId": "8",
  "framework": "CIS"
}
```

### 12. find_by_control

Reverse lookup: Find PCI-DSS requirements by control ID from another framework.

Parameters:
- `controlId` (required): Control ID to search for (e.g., "SC-7", "AU-2", "4.4")
- `framework` (optional): Filter by specific framework

Example:
```json
{
  "controlId": "AU-2",
  "framework": "NIST-800-53"
}
```

### 13. analyze_coverage

Analyze the mapping coverage of PCI-DSS requirements to a specific framework.

Parameters:
- `framework` (required): Framework to analyze (NIST-800-53, ISO-27001, FedRAMP, CIS, SOC2)

Example:
```json
{
  "framework": "NIST-800-53"
}
```

### Gap Analysis & Migration Tools

### 14. compare_versions

Compare PCI-DSS v3.2.1 with v4.0.1 to understand what changed.

Parameters:
- `requirementId` (optional): Specific requirement ID to compare (or all if omitted)
- `showOnlyChanges` (default: true): Only show requirements that changed from v3.2.1

Returns:
- Change summary with counts by type (new, modified, renumbered, unchanged)
- Detailed change descriptions
- v3.2.1 vs v4.0.1 requirement text comparison
- Migration guidance

Example:
```json
{
  "requirementId": "6",
  "showOnlyChanges": true
}
```

Use Cases:
- Migration planning from v3.2.1 to v4.0.1
- Understanding what's new in v4.0.1
- Identifying requirements that need re-implementation
- Gap analysis for v4.0.1 compliance
- Training teams on version changes

### 15. get_evidence_examples

Get evidence collection examples and guidance for a PCI-DSS requirement.

Parameters:
- `requirementId` (required): PCI-DSS requirement ID to get evidence examples for

Returns:
- Evidence types (configuration, documentation, scan, report, log)
- Example artifacts for each type
- Collection tips and best practices
- Disclaimer about consulting with QSA

Example:
```json
{
  "requirementId": "10"
}
```

Use Cases:
- Audit preparation and evidence gathering
- Understanding what QSAs expect to see
- Planning evidence collection processes
- Training teams on documentation requirements
- Building compliance evidence repositories
- Self-assessment preparation

## Data Structure

The server expects PCI-DSS data in `data/converted/requirements.json`:

```json
{
  "info": {
    "version": "4.0.1",
    "published": "2024-03-31",
    "effectiveDate": "2024-03-31",
    "documentType": "standard"
  },
  "requirements": [
    {
      "id": "1",
      "number": "1",
      "level": 1,
      "title": "Install and Maintain Network Security Controls",
      "statement": "...",
      "definedApproach": { ... },
      "customizedApproach": { ... }
    }
  ]
}
```

## PDF Conversion Details

### How It Works

The conversion pipeline uses [Docling](https://github.com/docling-project/docling) to extract structured data from PCI-DSS PDFs:

1. **Python Script** (`scripts/docling_convert.py`)
   - Parses PDF using Docling
   - Extracts hierarchical requirements (1 → 1.1 → 1.1.1)
   - Identifies testing procedures (1.a, 1.b, etc.)
   - Extracts customized approach objectives (v4.0 feature)

2. **TypeScript Wrapper** (`src/docling.ts`)
   - Manages Python subprocess execution
   - Handles conversion caching (based on PDF hash)
   - Validates output format

3. **CLI Tool** (`npm run convert-pdfs`)
   - Batch converts all PDFs in `data/pdfs/`
   - Skips already-converted files (unless PDF changed)
   - Generates JSON, Markdown, and metadata

### Troubleshooting

**Python not found:**
```bash
export PYTHON_PATH=/path/to/python3
npm run convert-pdfs
```

**Docling installation issues:**
```bash
# Ensure you have Python 3.9+
python3 --version

# Reinstall dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

**PDF not converting properly:**
- Ensure PDF is not encrypted/password protected
- Check PDF is the official PCI-DSS document from PCI SSC
- Try re-downloading the PDF

## Environment Variables

- `PCIDSS_DOCS_PATH` - Custom path to data directory (default: `<project>/data`)
- `PCIDSS_DOCS_CACHE` - Custom cache directory (default: `~/.cache/pcidss-docs`)
- `PYTHON_PATH` - Custom Python 3 executable (default: `python3`)

## Architecture

Based on the proven [FedRAMP Docs MCP](https://github.com/ethanolivertroy/fedramp-docs-mcp) architecture:

- **TypeScript** with strict mode
- **Zod** for schema validation
- **Docling** (Python) for PDF parsing and extraction
- **Lunr** for full-text search with relevance scoring
- Git-based caching for fast startup
- MCP SDK for protocol implementation

### Key Design Decisions

1. **Pre-Process PDFs** - Convert once, cache results (fast startup)
2. **Python Subprocess** - Simple Docling integration, no complex bundling
3. **Flat Requirement Map** - O(1) lookups by ID, parent references for hierarchy
4. **Hash-Based Caching** - Only re-convert if PDF changes

## License

MIT

## Author

Ethan Troy
