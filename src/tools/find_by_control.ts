import { z } from "zod";
import type { ToolDefinition } from "./base.js";
import { getIndexState, getRequirement } from "../indexer.js";
import { createError } from "../util.js";

const findByControlSchema = z.object({
  controlId: z
    .string()
    .describe("Control ID to search for (e.g., 'SC-7', 'AU-2', '4.4')"),
  framework: z
    .enum(["NIST-800-53", "ISO-27001", "FedRAMP", "CIS", "SOC2"])
    .optional()
    .describe("Filter by specific framework (optional)"),
});

export interface FindByControlResult {
  controlId: string;
  totalMappings: number;
  pciDssRequirements: Array<{
    requirementId: string;
    requirementTitle: string;
    framework: string;
    controlName: string;
    controlFamily: string;
    mappingType: string;
  }>;
}

export const findByControl: ToolDefinition<
  typeof findByControlSchema,
  FindByControlResult
> = {
  name: "find_by_control",
  description:
    "Reverse lookup: Find PCI-DSS requirements that map to a specific control in another framework. " +
    "Useful for understanding which PCI-DSS requirements you need to address if you already have " +
    "a specific NIST, ISO, CIS, or other framework control implemented.",
  schema: findByControlSchema,
  execute: async (args) => {
    const { controlId, framework } = args;

    const state = getIndexState();

    if (!state.controlMappingsData) {
      throw createError({
        code: "NOT_FOUND",
        message: "Control mappings data not loaded",
        hint: "Ensure control-mappings.json exists in the data directory",
      });
    }

    const results: Array<{
      requirementId: string;
      requirementTitle: string;
      framework: string;
      controlName: string;
      controlFamily: string;
      mappingType: string;
    }> = [];

    // Search through all mappings
    for (const mapping of state.controlMappingsData.mappings) {
      // Filter by framework if specified
      if (framework && mapping.framework !== framework) {
        continue;
      }

      // Check if any control in this mapping matches
      for (const control of mapping.controls) {
        if (control.controlId === controlId) {
          const requirement = getRequirement(mapping.pciDssRequirement);
          results.push({
            requirementId: mapping.pciDssRequirement,
            requirementTitle: requirement?.title || "Unknown",
            framework: mapping.framework,
            controlName: control.controlName,
            controlFamily: control.controlFamily,
            mappingType: control.mappingType,
          });
        }
      }
    }

    return {
      controlId,
      totalMappings: results.length,
      pciDssRequirements: results,
    };
  },
};
