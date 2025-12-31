import { z } from "zod";
import type { ToolDefinition } from "./base.js";
import { getRequirement } from "../indexer.js";
import { createError } from "../util.js";

const getCustomizedApproachSchema = z.object({
  requirementId: z
    .string()
    .describe("Requirement ID (e.g., '1', '1.2', '1.2.3')"),
});

export interface CustomizedApproachResult {
  requirementId: string;
  title: string;
  objective: string;
  exampleImplementations?: string[];
  hasDefinedApproach: boolean;
  note: string;
}

export const getCustomizedApproach: ToolDefinition<
  typeof getCustomizedApproachSchema,
  CustomizedApproachResult
> = {
  name: "get_customized_approach",
  description:
    "Get the Customized Approach objective for a specific PCI-DSS requirement. " +
    "The Customized Approach (new in v4.0) allows entities to implement controls differently " +
    "than the Defined Approach, as long as the stated objective is met. " +
    "Includes the objective and example implementations where available.",
  schema: getCustomizedApproachSchema,
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

    const customizedApproach = requirement.customizedApproach;
    const objective = customizedApproach?.objective || "";
    const exampleImplementations = customizedApproach?.exampleImplementations;
    const hasDefinedApproach = !!requirement.definedApproach?.requirement;

    return {
      requirementId: requirement.id,
      title: requirement.title,
      objective: objective || "No customized approach objective specified",
      exampleImplementations,
      hasDefinedApproach,
      note:
        "The Customized Approach allows implementing controls differently as long as the objective is met. " +
        "Entities using this approach must demonstrate that their implementation achieves the stated objective.",
    };
  },
};
