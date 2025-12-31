import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createError, envString } from "./util.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface ConversionResult {
  success: boolean;
  requirementCount?: number;
  error?: string;
}

export interface ConversionMetadata {
  convertedAt: string;
  pdfPath: string;
  pdfHash: string;
  requirementCount: number;
}

/**
 * Get the path to the Python executable
 */
function getPythonPath(): string {
  const customPath = envString("PYTHON_PATH");
  if (customPath) {
    return customPath;
  }

  // Try common Python 3 executables
  const candidates = ["python3", "python"];

  for (const candidate of candidates) {
    try {
      const result = spawn(candidate, ["--version"], {
        stdio: "pipe",
        shell: true,
      });

      if (result.exitCode === 0) {
        return candidate;
      }
    } catch {
      continue;
    }
  }

  return "python3"; // Default fallback
}

/**
 * Check if PDF needs conversion (based on hash comparison)
 */
export async function needsConversion(
  pdfPath: string,
  outputDir: string,
): Promise<boolean> {
  const metadataPath = path.join(outputDir, "metadata.json");

  if (!fs.existsSync(metadataPath)) {
    return true;
  }

  try {
    const metadata = JSON.parse(
      fs.readFileSync(metadataPath, "utf-8"),
    ) as ConversionMetadata;

    // Check if PDF has changed (hash comparison)
    const crypto = await import("node:crypto");
    const pdfContent = fs.readFileSync(pdfPath);
    const currentHash = crypto
      .createHash("sha256")
      .update(pdfContent)
      .digest("hex");

    return metadata.pdfHash !== currentHash;
  } catch {
    return true;
  }
}

/**
 * Convert PDF to JSON/Markdown using Docling Python script
 */
export async function convertPdf(
  pdfPath: string,
  outputDir: string,
): Promise<ConversionResult> {
  // Validate PDF exists
  if (!fs.existsSync(pdfPath)) {
    throw createError({
      code: "IO_ERROR",
      message: `PDF not found: ${pdfPath}`,
      hint: "Download PCI-DSS PDF from https://www.pcisecuritystandards.org/document_library/",
    });
  }

  // Get Python script path
  const projectRoot = path.resolve(__dirname, "..");
  const scriptPath = path.join(projectRoot, "scripts", "docling_convert.py");

  if (!fs.existsSync(scriptPath)) {
    throw createError({
      code: "IO_ERROR",
      message: `Conversion script not found: ${scriptPath}`,
    });
  }

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Execute Python script
  const pythonPath = getPythonPath();

  console.error(`Running: ${pythonPath} ${scriptPath} ${pdfPath} ${outputDir}`);

  return new Promise((resolve, reject) => {
    const process = spawn(pythonPath, [scriptPath, pdfPath, outputDir], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    process.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    process.stderr?.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      // Echo stderr to console for progress updates
      console.error(text.trim());
    });

    process.on("close", (code) => {
      if (code !== 0) {
        reject(
          createError({
            code: "PARSE_ERROR",
            message: `PDF conversion failed with exit code ${code}`,
            hint:
              stderr.includes("docling")
                ? "Run: pip install -r requirements.txt"
                : stderr || "Check Python dependencies",
          }),
        );
        return;
      }

      // Read metadata to get requirement count
      try {
        const metadataPath = path.join(outputDir, "metadata.json");
        const metadata = JSON.parse(
          fs.readFileSync(metadataPath, "utf-8"),
        ) as ConversionMetadata;

        resolve({
          success: true,
          requirementCount: metadata.requirementCount,
        });
      } catch (error) {
        resolve({
          success: true,
          requirementCount: undefined,
        });
      }
    });

    process.on("error", (error) => {
      reject(
        createError({
          code: "IO_ERROR",
          message: `Failed to execute Python: ${error.message}`,
          hint: "Ensure Python 3 is installed and in PATH. Set PYTHON_PATH environment variable if needed.",
        }),
      );
    });
  });
}

/**
 * Convert all PDFs in the pdfs directory
 */
export async function convertAllPdfs(
  pdfsDir: string,
  outputDir: string,
): Promise<ConversionResult[]> {
  if (!fs.existsSync(pdfsDir)) {
    throw createError({
      code: "IO_ERROR",
      message: `PDFs directory not found: ${pdfsDir}`,
      hint: "Create data/pdfs/ directory and add PCI-DSS PDF files",
    });
  }

  // Find all PDF files
  const files = fs.readdirSync(pdfsDir);
  const pdfFiles = files.filter((f) => f.toLowerCase().endsWith(".pdf"));

  if (pdfFiles.length === 0) {
    throw createError({
      code: "IO_ERROR",
      message: `No PDF files found in ${pdfsDir}`,
      hint: "Download PCI-DSS v4.0.1 PDF and place in data/pdfs/",
    });
  }

  console.error(`Found ${pdfFiles.length} PDF file(s) to convert`);

  const results: ConversionResult[] = [];

  for (const pdfFile of pdfFiles) {
    const pdfPath = path.join(pdfsDir, pdfFile);

    console.error(`\nProcessing: ${pdfFile}`);

    // Check if conversion needed
    const needed = await needsConversion(pdfPath, outputDir);

    if (!needed) {
      console.error(`  Skipped (already converted and up to date)`);
      results.push({ success: true });
      continue;
    }

    try {
      const result = await convertPdf(pdfPath, outputDir);
      results.push(result);
    } catch (error) {
      console.error(`  Error: ${(error as Error).message}`);
      results.push({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  return results;
}
