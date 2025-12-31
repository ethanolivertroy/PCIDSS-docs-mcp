import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import type { ToolDefinition } from "./base.js";
import { getIndexState, getRequirement } from "../indexer.js";
import { createError } from "../util.js";

const getEvidenceExamplesSchema = z.object({
  requirementId: z
    .string()
    .describe("PCI-DSS requirement ID to get evidence examples for"),
});

interface EvidenceType {
  type: string;
  description: string;
  examples: string[];
}

interface EvidenceExamples {
  requirement: string;
  evidenceTypes: EvidenceType[];
}

interface EvidenceExamplesData {
  version: string;
  lastUpdated: string;
  description: string;
  disclaimer: string;
  examples: Record<string, EvidenceExamples>;
}

export interface GetEvidenceExamplesResult {
  requirementId: string;
  requirementTitle: string;
  disclaimer: string;
  evidenceTypes: EvidenceType[];
  totalTypes: number;
  collectionTips: string[];
}

export const getEvidenceExamples: ToolDefinition<
  typeof getEvidenceExamplesSchema,
  GetEvidenceExamplesResult
> = {
  name: "get_evidence_examples",
  description:
    "Get evidence collection examples and guidance for a PCI-DSS requirement. " +
    "Shows what types of evidence to collect, example artifacts, and collection tips. " +
    "Useful for audit preparation, evidence gathering, and understanding what QSAs expect to see. " +
    "Note: Examples are guidance only; consult your QSA for specific requirements.",
  schema: getEvidenceExamplesSchema,
  execute: async (args) => {
    const { requirementId } = args;

    const state = getIndexState();

    // Verify requirement exists
    const requirement = getRequirement(requirementId);
    if (!requirement) {
      throw createError({
        code: "NOT_FOUND",
        message: `PCI-DSS requirement ${requirementId} not found`,
        hint: "Check the requirement ID format (e.g., '1', '2', '3')",
      });
    }

    // Load evidence examples data
    const evidencePath = path.join(state.repoPath, "evidence-examples.json");
    let evidenceData: EvidenceExamplesData;

    try {
      const content = fs.readFileSync(evidencePath, "utf-8");
      evidenceData = JSON.parse(content) as EvidenceExamplesData;
    } catch (error) {
      throw createError({
        code: "NOT_FOUND",
        message: "Evidence examples data not found",
        hint: "Ensure evidence-examples.json exists in the data directory",
      });
    }

    // Get evidence examples for this requirement
    // For sub-requirements, try to get parent's examples
    let exampleKey = requirementId;
    if (!evidenceData.examples[exampleKey]) {
      // Try parent requirement (e.g., "1.2" -> "1")
      const parts = requirementId.split(".");
      if (parts.length > 1) {
        exampleKey = parts[0];
      }
    }

    const examples = evidenceData.examples[exampleKey];

    if (!examples) {
      return {
        requirementId,
        requirementTitle: requirement.title,
        disclaimer: evidenceData.disclaimer,
        evidenceTypes: [],
        totalTypes: 0,
        collectionTips: [
          "Evidence examples not yet available for this requirement.",
          "Consult your QSA for specific evidence requirements.",
          "Review the testing procedures for this requirement for guidance.",
          "Consider evidence types from similar requirements.",
        ],
      };
    }

    // General collection tips
    const collectionTips = [
      "Collect evidence throughout the year, not just before assessment",
      "Ensure evidence covers the entire assessment period",
      "Label and organize evidence clearly by requirement",
      "Include dates and context for all evidence items",
      "Keep evidence in a centralized, secure location",
      "Verify evidence completeness with testing procedures",
    ];

    return {
      requirementId,
      requirementTitle: requirement.title,
      disclaimer: evidenceData.disclaimer,
      evidenceTypes: examples.evidenceTypes,
      totalTypes: examples.evidenceTypes.length,
      collectionTips,
    };
  },
};
