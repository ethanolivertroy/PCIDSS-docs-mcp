import { z } from "zod";
import type { ToolDefinition } from "./base.js";
import { getAllRequirements, getChildrenRequirements, getRequirement } from "../indexer.js";
import { createError } from "../util.js";

const getComplianceChecklistSchema = z.object({
  requirementId: z
    .string()
    .optional()
    .describe("Requirement ID to generate checklist for (or all if omitted)"),
  level: z
    .number()
    .min(1)
    .max(4)
    .optional()
    .describe("Only include requirements at this level"),
  includeChildren: z
    .boolean()
    .default(true)
    .describe("Include child requirements"),
});

export interface ChecklistItem {
  id: string;
  level: number;
  title: string;
  statement: string;
  testingProcedureCount: number;
  status: "not_started";
  notes: string;
}

export interface ComplianceChecklistResult {
  scope: string;
  totalRequirements: number;
  checklist: ChecklistItem[];
  summary: {
    byLevel: Record<number, number>;
  };
}

export const getComplianceChecklist: ToolDefinition<
  typeof getComplianceChecklistSchema,
  ComplianceChecklistResult
> = {
  name: "get_compliance_checklist",
  description:
    "Generate a compliance checklist for PCI-DSS requirements. " +
    "Can generate for all requirements or a specific requirement and its children. " +
    "Useful for tracking compliance progress and planning assessments.",
  schema: getComplianceChecklistSchema,
  execute: async (args) => {
    const { requirementId, level, includeChildren } = args;

    let requirements;

    if (requirementId) {
      const parentReq = getRequirement(requirementId);
      if (!parentReq) {
        throw createError({
          code: "NOT_FOUND",
          message: `Requirement ${requirementId} not found`,
          hint: "Check the requirement ID format (e.g., '1', '1.2', '1.2.3')",
        });
      }

      if (includeChildren) {
        // Get requirement and all descendants
        requirements = [parentReq];
        const collectChildren = (id: string) => {
          const children = getChildrenRequirements(id);
          for (const child of children) {
            requirements.push(child);
            collectChildren(child.id);
          }
        };
        collectChildren(requirementId);
      } else {
        requirements = [parentReq];
      }
    } else {
      // Get all requirements
      requirements = getAllRequirements();
    }

    // Filter by level if specified
    if (level !== undefined) {
      requirements = requirements.filter((req) => req.level === level);
    }

    // Sort by ID
    requirements.sort((a, b) =>
      a.id.localeCompare(b.id, undefined, { numeric: true }),
    );

    // Build checklist
    const checklist: ChecklistItem[] = requirements.map((req) => ({
      id: req.id,
      level: req.level,
      title: req.title,
      statement: req.statement,
      testingProcedureCount: req.definedApproach?.testingProcedures?.length || 0,
      status: "not_started" as const,
      notes: "",
    }));

    // Calculate summary
    const byLevel: Record<number, number> = {};
    for (const item of checklist) {
      byLevel[item.level] = (byLevel[item.level] || 0) + 1;
    }

    return {
      scope: requirementId
        ? `Requirement ${requirementId}${includeChildren ? " and children" : ""}`
        : "All PCI-DSS v4.0.1 requirements",
      totalRequirements: checklist.length,
      checklist,
      summary: {
        byLevel,
      },
    };
  },
};
