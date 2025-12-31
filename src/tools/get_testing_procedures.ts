import { z } from "zod";
import type { ToolDefinition } from "./base.js";
import { getRequirement } from "../indexer.js";
import { createError } from "../util.js";
import type { TestingProcedure } from "../types.js";

const getTestingProceduresSchema = z.object({
  requirementId: z
    .string()
    .describe("Requirement ID (e.g., '1', '1.2', '1.2.3')"),
});

export interface TestingProceduresResult {
  requirementId: string;
  title: string;
  procedures: TestingProcedure[];
  totalProcedures: number;
}

export const getTestingProcedures: ToolDefinition<
  typeof getTestingProceduresSchema,
  TestingProceduresResult
> = {
  name: "get_testing_procedures",
  description:
    "Get all testing procedures for a specific PCI-DSS requirement. " +
    "Testing procedures define how QSAs (Qualified Security Assessors) validate compliance. " +
    "Includes procedure IDs (e.g., 1.2.3.a, 1.2.3.b) and expected evidence.",
  schema: getTestingProceduresSchema,
  execute: async (args) => {
    const { requirementId } = args;

    const requirement = getRequirement(requirementId);

    if (!requirement) {
      throw createError({
        code: "NOT_FOUND",
        message: `Requirement ${requirementId} not found`,
        hint: "Check the requirement ID format (e.g., '1', '1.2', '1.2.3')",
      });
    }

    const procedures = requirement.definedApproach?.testingProcedures || [];

    return {
      requirementId: requirement.id,
      title: requirement.title,
      procedures,
      totalProcedures: procedures.length,
    };
  },
};
