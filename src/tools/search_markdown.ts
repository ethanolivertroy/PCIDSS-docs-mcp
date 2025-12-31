import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import type { ToolDefinition } from "./base.js";
import { getIndexState } from "../indexer.js";

const searchMarkdownSchema = z.object({
  query: z.string().describe("Search query for guidance documentation"),
  limit: z.number().min(1).max(50).default(10).describe("Maximum results to return"),
  contextLines: z
    .number()
    .min(0)
    .max(10)
    .default(2)
    .describe("Number of context lines before/after match"),
});

export interface MarkdownSearchResult {
  query: string;
  total: number;
  results: Array<{
    lineNumber: number;
    match: string;
    context: {
      before: string[];
      after: string[];
    };
  }>;
}

export const searchMarkdown: ToolDefinition<
  typeof searchMarkdownSchema,
  MarkdownSearchResult
> = {
  name: "search_markdown",
  description:
    "Search the full PCI-DSS markdown documentation for guidance, purpose statements, good practices, and examples. " +
    "Useful for finding detailed explanations and implementation guidance beyond the requirement text itself.",
  schema: searchMarkdownSchema,
  execute: async (args) => {
    const { query, limit, contextLines } = args;

    const state = getIndexState();
    const markdownPath = path.join(state.repoPath, "converted", "requirements.md");

    // Read markdown file
    let markdown: string;
    try {
      markdown = fs.readFileSync(markdownPath, "utf-8");
    } catch (error) {
      throw new Error(
        `Failed to read markdown file: ${(error as Error).message}`,
      );
    }

    const lines = markdown.split("\n");
    const lowerQuery = query.toLowerCase();
    const matches: Array<{
      lineNumber: number;
      match: string;
      context: {
        before: string[];
        after: string[];
      };
    }> = [];

    // Search through lines
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lowerQuery)) {
        // Get context lines
        const before: string[] = [];
        for (
          let j = Math.max(0, i - contextLines);
          j < i;
          j++
        ) {
          before.push(lines[j]);
        }

        const after: string[] = [];
        for (
          let j = i + 1;
          j < Math.min(lines.length, i + 1 + contextLines);
          j++
        ) {
          after.push(lines[j]);
        }

        matches.push({
          lineNumber: i + 1, // 1-indexed
          match: lines[i],
          context: {
            before,
            after,
          },
        });

        if (matches.length >= limit) {
          break;
        }
      }
    }

    return {
      query,
      total: matches.length,
      results: matches,
    };
  },
};
