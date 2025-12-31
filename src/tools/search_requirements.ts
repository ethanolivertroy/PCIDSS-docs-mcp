import { z } from "zod";
import lunr from "lunr";
import type { ToolDefinition } from "./base.js";
import { getAllRequirements, getRequirement } from "../indexer.js";
import type { PciDssRequirement } from "../types.js";
import { PCI_DSS_SYNONYMS } from "./search_synonyms.js";

// Schema for search_requirements parameters
const searchRequirementsSchema = z.object({
  query: z.string().describe("Search query (full-text search across requirements)"),
  limit: z.number().min(1).max(100).default(20).describe("Maximum results to return"),
  includeGuidance: z
    .boolean()
    .default(false)
    .describe("Include guidance/purpose text in search"),
});

export interface SearchResult {
  requirement: PciDssRequirement;
  score: number;
  matchedFields: string[];
}

/**
 * Build Lunr search index for requirements
 */
function buildSearchIndex(): lunr.Index {
  const requirements = getAllRequirements();

  return lunr(function () {
    this.ref("id");
    this.field("id", { boost: 10 });
    this.field("title", { boost: 8 });
    this.field("statement", { boost: 5 });
    this.field("definedApproachRequirement", { boost: 3 });
    this.field("testingProcedures", { boost: 2 });
    this.field("customizedObjective", { boost: 2 });

    for (const req of requirements) {
      const doc: any = {
        id: req.id,
        title: req.title || "",
        statement: req.statement || "",
        definedApproachRequirement:
          req.definedApproach?.requirement || "",
        testingProcedures:
          req.definedApproach?.testingProcedures
            ?.map((tp) => tp.description)
            .join(" ") || "",
        customizedObjective:
          req.customizedApproach?.objective || "",
      };

      this.add(doc);
    }
  });
}

// Cache the search index
let searchIndexCache: lunr.Index | null = null;

function getSearchIndex(): lunr.Index {
  if (!searchIndexCache) {
    searchIndexCache = buildSearchIndex();
  }
  return searchIndexCache;
}

/**
 * Expand query with PCI-DSS v3.2.1 → v4.0.1 terminology synonyms
 *
 * Converts legacy terminology (e.g., "firewall") to include v4.0.1
 * equivalents (e.g., "network security controls") for better search results.
 *
 * @param query Original user search query
 * @returns Expanded query including synonyms, or original if no synonyms found
 */
function expandQueryWithSynonyms(query: string): string {
  const lowerQuery = query.toLowerCase().trim();
  const words = lowerQuery.split(/\s+/);

  // Start with the original query terms
  const expansions: string[] = [query];

  // Check each word for synonyms
  for (const word of words) {
    if (PCI_DSS_SYNONYMS[word]) {
      // Add all synonyms for this word
      for (const synonym of PCI_DSS_SYNONYMS[word]) {
        expansions.push(synonym);
      }
    }
  }

  // If we found synonyms, create an expanded query
  // Lunr will implicitly OR these terms together
  if (expansions.length > 1) {
    return expansions.join(" ");
  }

  // No synonyms found, return original query
  return query;
}

export interface SearchRequirementsResult {
  query: string;
  expandedQuery?: string; // Query after synonym expansion (if different from original)
  total: number;
  maxScore: number;
  results: Array<{
    id: string;
    title: string;
    statement: string;
    level: number;
    score: number;
    matchedFields: string[];
    definedApproach?: any;
    customizedApproach?: any;
  }>;
}

export const searchRequirements: ToolDefinition<
  typeof searchRequirementsSchema,
  SearchRequirementsResult
> = {
  name: "search_requirements",
  description:
    "Search PCI-DSS requirements using full-text search with automatic synonym expansion. " +
    "Recognizes v3.2.1 terminology (e.g., 'firewall') and expands to v4.0.1 equivalents (e.g., 'network security controls'). " +
    "Searches across requirement IDs, titles, statements, testing procedures, and customized approach objectives. " +
    "Returns ranked results with relevance scores. " +
    "Supported synonym expansions include: firewall→NSC, two-factor→MFA, application→software/system, and more.",
  schema: searchRequirementsSchema,
  execute: async (args) => {
    const { query, limit, includeGuidance } = args;

    // Build/get search index
    const idx = getSearchIndex();

    // Expand query with v3.2.1 → v4.0.1 terminology synonyms
    const expandedQuery = expandQueryWithSynonyms(query);

    // Perform search with expanded query
    const searchResults = idx.search(expandedQuery);

    // Get top results with scores
    const results: SearchResult[] = searchResults
      .slice(0, limit)
      .map((result) => {
        const req = getRequirement(result.ref);
        if (!req) {
          return null;
        }

        // Determine which fields matched
        const matchedFields: string[] = [];
        const lowerQuery = query.toLowerCase();

        if (req.id.toLowerCase().includes(lowerQuery)) {
          matchedFields.push("id");
        }
        if (req.title?.toLowerCase().includes(lowerQuery)) {
          matchedFields.push("title");
        }
        if (req.statement?.toLowerCase().includes(lowerQuery)) {
          matchedFields.push("statement");
        }
        if (
          req.definedApproach?.requirement
            ?.toLowerCase()
            .includes(lowerQuery)
        ) {
          matchedFields.push("definedApproachRequirement");
        }
        if (
          req.definedApproach?.testingProcedures?.some((tp) =>
            tp.description.toLowerCase().includes(lowerQuery),
          )
        ) {
          matchedFields.push("testingProcedures");
        }
        if (
          req.customizedApproach?.objective
            ?.toLowerCase()
            .includes(lowerQuery)
        ) {
          matchedFields.push("customizedObjective");
        }

        return {
          requirement: req,
          score: result.score,
          matchedFields,
        };
      })
      .filter((r): r is SearchResult => r !== null);

    return {
      query,
      expandedQuery: expandedQuery !== query ? expandedQuery : undefined,
      total: results.length,
      maxScore: results[0]?.score || 0,
      results: results.map((r) => ({
        id: r.requirement.id,
        title: r.requirement.title,
        statement: r.requirement.statement,
        level: r.requirement.level,
        score: r.score,
        matchedFields: r.matchedFields,
        ...(includeGuidance && {
          definedApproach: r.requirement.definedApproach,
          customizedApproach: r.requirement.customizedApproach,
        }),
      })),
    };
  },
};
