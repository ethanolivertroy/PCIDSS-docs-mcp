import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { simpleGit } from "simple-git";

import { createError, envString } from "./util.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Get the path to the PCI-DSS docs repository
 * For this implementation, the data is committed with the project
 */
export function getRepoPath(): string {
  // Check for custom path in environment
  const customPath = envString("PCIDSS_DOCS_PATH");
  if (customPath) {
    return path.resolve(customPath);
  }

  // Default: use data directory in project root
  const projectRoot = path.resolve(__dirname, "..");
  return path.join(projectRoot, "data");
}

/**
 * Ensure the repository is ready
 * For PCI-DSS MCP, we expect the data to be committed with the project
 */
export async function ensureRepoReady(): Promise<string> {
  const repoPath = getRepoPath();

  if (!fs.existsSync(repoPath)) {
    throw createError({
      code: "REPO_CLONE_FAILED",
      message: `Data directory not found: ${repoPath}`,
      hint: "The data directory should be committed with the project. Run 'npm run convert-pdfs' to generate the data.",
    });
  }

  const convertedPath = path.join(repoPath, "converted");
  if (!fs.existsSync(convertedPath)) {
    throw createError({
      code: "REPO_CLONE_FAILED",
      message: `Converted data not found: ${convertedPath}`,
      hint: "Run 'npm run convert-pdfs' to convert PCI-DSS PDFs to JSON/Markdown.",
    });
  }

  const requirementsPath = path.join(convertedPath, "requirements.json");
  if (!fs.existsSync(requirementsPath)) {
    throw createError({
      code: "REPO_CLONE_FAILED",
      message: `requirements.json not found: ${requirementsPath}`,
      hint: "Run 'npm run convert-pdfs' to generate requirements.json from PCI-DSS PDF.",
    });
  }

  return repoPath;
}

/**
 * Get the current git HEAD hash (for cache invalidation)
 */
export async function getGitHead(repoPath: string): Promise<string | null> {
  try {
    const git = simpleGit(repoPath);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return null;
    }
    const revParse = await git.revparse(["HEAD"]);
    return revParse.trim();
  } catch {
    return null;
  }
}

/**
 * Get cache directory path
 */
export function getCachePath(): string {
  const customCache = envString("PCIDSS_DOCS_CACHE");
  if (customCache) {
    return path.resolve(customCache);
  }
  return path.join(os.homedir(), ".cache", "pcidss-docs");
}

/**
 * Ensure cache directory exists
 */
export function ensureCacheDir(): string {
  const cachePath = getCachePath();
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true });
  }
  return cachePath;
}
