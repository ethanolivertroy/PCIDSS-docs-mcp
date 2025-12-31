import { z } from "zod";

import type { ToolDefinition } from "./base.js";
import { getRequirement, getChildrenRequirements } from "../indexer.js";
import type { PciDssRequirement } from "../types.js";
import { createError } from "../util.js";

const GetRequirementSchema = z.object({
  id: z.string(),
});

type GetRequirementInput = z.infer<typeof GetRequirementSchema>;

interface GetRequirementResult {
  requirement: PciDssRequirement;
  children?: PciDssRequirement[];
  parent?: PciDssRequirement;
}

export const getRequirementTool: ToolDefinition<
  typeof GetRequirementSchema,
  GetRequirementResult
> = {
  name: "get_requirement",
  description: "Get full details for a specific PCI-DSS requirement by ID",
  schema: GetRequirementSchema,
  execute: async (input: GetRequirementInput) => {
    const requirement = getRequirement(input.id);

    if (!requirement) {
      throw createError({
        code: "NOT_FOUND",
        message: `Requirement not found: ${input.id}`,
        hint: "Use list_requirements to see available requirement IDs",
      });
    }

    const result: GetRequirementResult = {
      requirement,
    };

    // Get children if this requirement has sub-requirements
    const children = getChildrenRequirements(input.id);
    if (children.length > 0) {
      result.children = children;
    }

    // Get parent if this requirement has one
    if (requirement.parentId) {
      const parent = getRequirement(requirement.parentId);
      if (parent) {
        result.parent = parent;
      }
    }

    return result;
  },
};
