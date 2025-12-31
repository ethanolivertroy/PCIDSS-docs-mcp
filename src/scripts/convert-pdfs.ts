#!/usr/bin/env node
/**
 * CLI tool to convert PCI-DSS PDFs to JSON/Markdown using Docling
 *
 * Usage:
 *   npm run convert-pdfs
 *
 * This will:
 * 1. Find all PDFs in data/pdfs/
 * 2. Convert them using Docling (Python)
 * 3. Output JSON and Markdown to data/converted/
 *
 * Environment Variables:
 *   PYTHON_PATH - Path to Python 3 executable (default: python3)
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

import { convertAllPdfs } from "../docling.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("\n📄 PCI-DSS PDF to JSON/Markdown Converter\n");

  // Get project root and paths
  const projectRoot = path.resolve(__dirname, "../..");
  const pdfsDir = path.join(projectRoot, "data", "pdfs");
  const outputDir = path.join(projectRoot, "data", "converted");

  // Check for Python dependencies
  console.log("Checking Python dependencies...");
  const requirementsTxt = path.join(projectRoot, "requirements.txt");

  if (!fs.existsSync(requirementsTxt)) {
    console.error(
      "❌ requirements.txt not found. This shouldn't happen in a properly set up project.",
    );
    process.exit(1);
  }

  console.log("✓ Found requirements.txt");
  console.log(
    "\nNote: Make sure you've installed Python dependencies:",
  );
  console.log("  pip install -r requirements.txt\n");

  // Check for PDFs directory
  if (!fs.existsSync(pdfsDir)) {
    console.log(`Creating ${pdfsDir}...`);
    fs.mkdirSync(pdfsDir, { recursive: true });
  }

  // Check if PDFs exist
  const pdfFiles = fs
    .readdirSync(pdfsDir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"));

  if (pdfFiles.length === 0) {
    console.log(`\n⚠️  No PDF files found in ${pdfsDir}\n`);
    console.log("To convert PCI-DSS documentation:\n");
    console.log("1. Download PCI-DSS v4.0.1 PDF from:");
    console.log(
      "   https://www.pcisecuritystandards.org/document_library/\n",
    );
    console.log("2. Place the PDF in:");
    console.log(`   ${pdfsDir}\n`);
    console.log("3. Run this script again:");
    console.log("   npm run convert-pdfs\n");
    process.exit(1);
  }

  // Convert PDFs
  try {
    const results = await convertAllPdfs(pdfsDir, outputDir);

    // Summary
    const successful = results.filter((r) => r.success).length;
    const failed = results.length - successful;

    console.log("\n" + "=".repeat(50));
    console.log(`\n✅ Conversion Summary:`);
    console.log(`   Total PDFs: ${results.length}`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);

    if (successful > 0) {
      console.log(`\n📁 Output directory: ${outputDir}`);
      console.log("   - requirements.json (structured data)");
      console.log("   - requirements.md (searchable markdown)");
      console.log("   - metadata.json (conversion info)\n");

      console.log("Next steps:");
      console.log("  1. Review the converted data in data/converted/");
      console.log("  2. Build the MCP server: npm run build");
      console.log("  3. Test the server: npm run dev\n");
    }

    if (failed > 0) {
      console.error("\n⚠️  Some conversions failed. Check errors above.\n");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Error during conversion:", (error as Error).message);
    console.error("\nTroubleshooting:");
    console.error("  - Ensure Python 3 is installed: python3 --version");
    console.error(
      "  - Install dependencies: pip install -r requirements.txt",
    );
    console.error("  - Check PDF file is valid and not corrupted\n");
    process.exit(1);
  }
}

main();
