import fs from "node:fs";
import path from "node:path";

import type {
  ControlMapping,
  ControlMappingsData,
  IndexState,
  MarkdownDoc,
  PciDssDocument,
  PciDssRequirement,
} from "./types.js";
import { createError, getParentRequirementId, sha256, startTimer } from "./util.js";
import { ensureCacheDir, getGitHead } from "./repo.js";

let indexState: IndexState | null = null;

const INDEX_CACHE_FILE = "index-v1.json";
const CACHE_ENABLED = true;

/**
 * Build the index from the PCI-DSS JSON document
 */
export async function buildIndex(repoPath: string): Promise<IndexState> {
  const timer = startTimer();

  // Try to load from cache first
  if (CACHE_ENABLED) {
    const cached = await loadCachedIndex(repoPath);
    if (cached) {
      const elapsed = timer.stop();
      console.error(`Loaded index from cache in ${elapsed.toFixed(0)}ms`);
      indexState = cached;
      return cached;
    }
  }

  const errors: string[] = [];

  // Load PCI-DSS document
  const convertedPath = path.join(repoPath, "converted", "requirements.json");
  let pciDssDocument: PciDssDocument;

  try {
    const content = fs.readFileSync(convertedPath, "utf-8");
    pciDssDocument = JSON.parse(content) as PciDssDocument;
  } catch (error) {
    throw createError({
      code: "PARSE_ERROR",
      message: `Failed to load requirements.json: ${(error as Error).message}`,
      hint: "Run 'npm run convert-pdfs' to generate requirements.json",
    });
  }

  // Build requirement map (flat map with O(1) lookup)
  const requirements = new Map<string, PciDssRequirement>();
  flattenRequirements(pciDssDocument.requirements, requirements);

  // Extract control mappings
  const controlMappings = extractControlMappings(requirements);

  // Load external control mappings data
  const controlMappingsData = loadControlMappingsData(repoPath);

  // Build markdown document map (empty for now, will be populated when we add search)
  const markdownDocs = new Map<string, MarkdownDoc>();

  const state: IndexState = {
    repoPath,
    indexedAt: Date.now(),
    documentVersion: pciDssDocument.info.version,
    pciDssDocument,
    requirements,
    controlMappings,
    controlMappingsData,
    markdownDocs,
    errors,
  };

  // Cache the index
  if (CACHE_ENABLED) {
    await persistIndex(state);
  }

  const elapsed = timer.stop();
  console.error(
    `Built index: ${requirements.size} requirements in ${elapsed.toFixed(0)}ms`,
  );

  indexState = state;
  return state;
}

/**
 * Flatten hierarchical requirements into a flat map
 * Recursively processes requirements and their children
 */
function flattenRequirements(
  requirements: PciDssRequirement[],
  map: Map<string, PciDssRequirement>,
): void {
  for (const req of requirements) {
    // Ensure parentId is set correctly
    if (!req.parentId && req.level > 1) {
      req.parentId = getParentRequirementId(req.id);
    }

    map.set(req.id, req);
  }
}

/**
 * Extract control mappings from requirements
 */
function extractControlMappings(
  requirements: Map<string, PciDssRequirement>,
): ControlMapping[] {
  const mappings: ControlMapping[] = [];

  for (const [reqId, req] of requirements.entries()) {
    if (req.controlMappings) {
      mappings.push(...req.controlMappings);
    }
  }

  return mappings;
}

/**
 * Load control mappings data from external file
 */
function loadControlMappingsData(repoPath: string): ControlMappingsData | undefined {
  try {
    const mappingsPath = path.join(repoPath, "control-mappings.json");

    if (!fs.existsSync(mappingsPath)) {
      console.error("Control mappings file not found, skipping");
      return undefined;
    }

    const content = fs.readFileSync(mappingsPath, "utf-8");
    return JSON.parse(content) as ControlMappingsData;
  } catch (error) {
    console.error(`Failed to load control mappings: ${(error as Error).message}`);
    return undefined;
  }
}

/**
 * Load cached index if available and valid
 */
async function loadCachedIndex(
  repoPath: string,
): Promise<IndexState | null> {
  try {
    const cachePath = ensureCacheDir();
    const cacheFile = path.join(cachePath, INDEX_CACHE_FILE);

    if (!fs.existsSync(cacheFile)) {
      return null;
    }

    const content = fs.readFileSync(cacheFile, "utf-8");
    const cached = JSON.parse(content);

    // Check if cache is still valid (same git HEAD)
    const currentHead = await getGitHead(repoPath);
    const cachedHead = cached.gitHead;

    if (currentHead && cachedHead && currentHead !== cachedHead) {
      console.error("Cache invalidated: git HEAD changed");
      return null;
    }

    // Reconstruct Map objects
    const state: IndexState = {
      ...cached,
      requirements: new Map(Object.entries(cached.requirements)),
      markdownDocs: new Map(Object.entries(cached.markdownDocs || {})),
    };

    return state;
  } catch (error) {
    console.error(`Failed to load cache: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Persist index to cache
 */
async function persistIndex(state: IndexState): Promise<void> {
  try {
    const cachePath = ensureCacheDir();
    const cacheFile = path.join(cachePath, INDEX_CACHE_FILE);

    const gitHead = await getGitHead(state.repoPath);

    const cacheData = {
      ...state,
      gitHead,
      requirements: Object.fromEntries(state.requirements),
      markdownDocs: Object.fromEntries(state.markdownDocs),
    };

    fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2), "utf-8");
    console.error(`Cached index to ${cacheFile}`);
  } catch (error) {
    console.error(`Failed to cache index: ${(error as Error).message}`);
  }
}

/**
 * Get the current index state
 */
export function getIndexState(): IndexState {
  if (!indexState) {
    throw createError({
      code: "INDEX_NOT_READY",
      message: "Index not built yet",
      hint: "Call buildIndex() first",
    });
  }
  return indexState;
}

/**
 * Get requirement by ID
 */
export function getRequirement(id: string): PciDssRequirement | undefined {
  const state = getIndexState();
  return state.requirements.get(id);
}

/**
 * Get all requirements
 */
export function getAllRequirements(): PciDssRequirement[] {
  const state = getIndexState();
  return Array.from(state.requirements.values());
}

/**
 * Get children of a requirement
 */
export function getChildrenRequirements(
  parentId: string,
): PciDssRequirement[] {
  const state = getIndexState();
  const children: PciDssRequirement[] = [];

  for (const req of state.requirements.values()) {
    if (req.parentId === parentId) {
      children.push(req);
    }
  }

  // Sort by ID
  children.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  return children;
}

/**
 * Get control mappings
 */
export function getControlMappings(): ControlMapping[] {
  const state = getIndexState();
  return state.controlMappings;
}

/**
 * Get PCI-DSS document
 */
export function getPciDssDocument(): PciDssDocument {
  const state = getIndexState();
  return state.pciDssDocument;
}
