import { z } from "zod";

import type { ToolDefinition } from "./base.js";
import { getAllRequirements } from "../indexer.js";
import type { PciDssRequirement } from "../types.js";
import { clamp } from "../util.js";

const ListRequirementsSchema = z.object({
  level: z.number().min(1).max(3).optional(),
  parentId: z.string().optional(),
  newInV4: z.boolean().optional(),
  changedFromV3: z.boolean().optional(),
  applicability: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

type ListRequirementsInput = z.infer<typeof ListRequirementsSchema>;

interface ListRequirementsResult {
  total: number;
  requirements: Array<{
    id: string;
    number: string;
    level: number;
    parentId?: string;
    title: string;
    statement: string;
    isNewInV4?: boolean;
    changedFromV3?: boolean;
  }>;
  offset: number;
  limit: number;
}

export const listRequirementsTool: ToolDefinition<
  typeof ListRequirementsSchema,
  ListRequirementsResult
> = {
  name: "list_requirements",
  description: "List PCI-DSS requirements with optional filtering by level, parent, and v4 changes",
  schema: ListRequirementsSchema,
  execute: async (input: ListRequirementsInput) => {
    let requirements = getAllRequirements();

    // Apply filters
    if (input.level !== undefined) {
      requirements = requirements.filter((req) => req.level === input.level);
    }

    if (input.parentId !== undefined) {
      requirements = requirements.filter((req) => req.parentId === input.parentId);
    }

    if (input.newInV4 !== undefined) {
      requirements = requirements.filter((req) => req.isNewInV4 === input.newInV4);
    }

    if (input.changedFromV3 !== undefined) {
      requirements = requirements.filter((req) => req.changedFromV3 === input.changedFromV3);
    }

    if (input.applicability !== undefined) {
      requirements = requirements.filter((req) =>
        req.applicability?.includes(input.applicability!)
      );
    }

    // Sort by ID
    requirements.sort((a, b) =>
      a.id.localeCompare(b.id, undefined, { numeric: true })
    );

    const total = requirements.length;
    const offset = clamp(input.offset, 0, total);
    const limit = clamp(input.limit, 1, 100);

    // Paginate
    const paginated = requirements.slice(offset, offset + limit);

    // Map to result format
    const result = paginated.map((req) => ({
      id: req.id,
      number: req.number,
      level: req.level,
      parentId: req.parentId,
      title: req.title,
      statement: req.statement,
      isNewInV4: req.isNewInV4,
      changedFromV3: req.changedFromV3,
    }));

    return {
      total,
      requirements: result,
      offset,
      limit,
    };
  },
};
