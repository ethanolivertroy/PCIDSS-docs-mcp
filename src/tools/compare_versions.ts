import { z } from "zod";
import type { ToolDefinition } from "./base.js";
import { getRequirement, getAllRequirements } from "../indexer.js";
import { createError } from "../util.js";

const compareVersionsSchema = z.object({
  requirementId: z
    .string()
    .optional()
    .describe("Specific requirement ID to compare (or all if omitted)"),
  showOnlyChanges: z
    .boolean()
    .default(true)
    .describe("Only show requirements that changed from v3.2.1"),
});

export interface VersionChange {
  requirementId: string;
  title: string;
  changeType: "new" | "modified" | "renumbered" | "unchanged";
  v3Requirement?: string;
  v4Requirement: string;
  summary: string;
}

export interface CompareVersionsResult {
  comparison: string;
  totalRequirements: number;
  changes: VersionChange[];
  summary: {
    new: number;
    modified: number;
    renumbered: number;
    unchanged: number;
  };
}

// Key changes from PCI-DSS v3.2.1 to v4.0.1
const knownChanges: Record<string, VersionChange> = {
  "6": {
    requirementId: "6",
    title: "Develop and Maintain Secure Systems and Software",
    changeType: "modified",
    v3Requirement: "Develop and maintain secure systems and applications",
    v4Requirement: "Develop and Maintain Secure Systems and Software",
    summary: "Expanded to include software development lifecycle and secure coding practices. Added Customized Approach option.",
  },
  "8": {
    requirementId: "8",
    title: "Identify Users and Authenticate Access to System Components",
    changeType: "modified",
    v3Requirement: "Identify and authenticate access to system components",
    v4Requirement: "Identify Users and Authenticate Access to System Components",
    summary: "Enhanced multi-factor authentication requirements. Added requirements for service providers (8.3.10.1).",
  },
  "11": {
    requirementId: "11",
    title: "Test Security of Systems and Networks Regularly",
    changeType: "modified",
    v3Requirement: "Regularly test security systems and processes",
    v4Requirement: "Test Security of Systems and Networks Regularly",
    summary: "Enhanced penetration testing requirements. Added authenticated scanning requirements.",
  },
  "12": {
    requirementId: "12",
    title: "Support Information Security with Organizational Policies and Programs",
    changeType: "modified",
    v3Requirement: "Maintain a policy that addresses information security for all personnel",
    v4Requirement: "Support Information Security with Organizational Policies and Programs",
    summary: "Expanded to include security awareness programs and targeted risk analysis. Added PCI-DSS scope confirmation.",
  },
};

export const compareVersions: ToolDefinition<
  typeof compareVersionsSchema,
  CompareVersionsResult
> = {
  name: "compare_versions",
  description:
    "Compare PCI-DSS v3.2.1 with v4.0.1 to understand what changed. " +
    "Shows new requirements, modifications, and renumbered requirements. " +
    "Useful for migration planning and understanding v4.0 changes. " +
    "Note: Key changes for major requirements are documented; detailed sub-requirement changes require full v3.2.1 data.",
  schema: compareVersionsSchema,
  execute: async (args) => {
    const { requirementId, showOnlyChanges } = args;

    let changes: VersionChange[] = [];

    if (requirementId) {
      // Compare specific requirement
      const requirement = getRequirement(requirementId);
      if (!requirement) {
        throw createError({
          code: "NOT_FOUND",
          message: `Requirement ${requirementId} not found`,
          hint: "Check the requirement ID format",
        });
      }

      const change = knownChanges[requirementId];
      if (change) {
        changes = [change];
      } else {
        changes = [
          {
            requirementId,
            title: requirement.title,
            changeType: "unchanged",
            v4Requirement: requirement.statement,
            summary: "No documented changes from v3.2.1 (or detailed change data not available)",
          },
        ];
      }
    } else {
      // Show all known changes
      const allRequirements = getAllRequirements();

      for (const req of allRequirements) {
        // Only process principal requirements (level 1)
        if (req.level !== 1) continue;

        const change = knownChanges[req.id];
        if (change) {
          changes.push(change);
        } else if (!showOnlyChanges) {
          changes.push({
            requirementId: req.id,
            title: req.title,
            changeType: "unchanged",
            v4Requirement: req.statement,
            summary: "No documented changes (or detailed change data not available)",
          });
        }
      }
    }

    // Calculate summary
    const summary = {
      new: changes.filter((c) => c.changeType === "new").length,
      modified: changes.filter((c) => c.changeType === "modified").length,
      renumbered: changes.filter((c) => c.changeType === "renumbered").length,
      unchanged: changes.filter((c) => c.changeType === "unchanged").length,
    };

    return {
      comparison: "PCI-DSS v3.2.1 → v4.0.1",
      totalRequirements: changes.length,
      changes,
      summary,
    };
  },
};
