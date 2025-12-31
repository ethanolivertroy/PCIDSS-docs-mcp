import { z } from "zod";
import type { ToolDefinition } from "./base.js";
import { getIndexState } from "../indexer.js";
import { createError } from "../util.js";

const listControlMappingsSchema = z.object({
  framework: z
    .enum(["NIST-800-53", "ISO-27001", "FedRAMP", "CIS", "SOC2", "all"])
    .default("all")
    .describe("Filter by framework (or 'all' for all frameworks)"),
  requirementId: z
    .string()
    .optional()
    .describe("Filter by PCI-DSS requirement ID"),
});

export interface ListControlMappingsResult {
  total: number;
  frameworks: string[];
  mappings: Array<{
    pciDssRequirement: string;
    framework: string;
    controls: Array<{
      controlId: string;
      controlName: string;
      controlFamily: string;
      mappingType: string;
    }>;
  }>;
}

export const listControlMappings: ToolDefinition<
  typeof listControlMappingsSchema,
  ListControlMappingsResult
> = {
  name: "list_control_mappings",
  description:
    "List all PCI-DSS to security framework control mappings. " +
    "Can filter by framework (NIST-800-53, ISO-27001, FedRAMP, CIS) or specific PCI-DSS requirement. " +
    "Shows how PCI-DSS requirements map to other compliance frameworks.",
  schema: listControlMappingsSchema,
  execute: async (args) => {
    const { framework, requirementId } = args;

    const state = getIndexState();

    if (!state.controlMappingsData) {
      throw createError({
        code: "NOT_FOUND",
        message: "Control mappings data not loaded",
        hint: "Ensure control-mappings.json exists in the data directory",
      });
    }

    let mappings = state.controlMappingsData.mappings;

    // Filter by framework if specified
    if (framework !== "all") {
      mappings = mappings.filter((m) => m.framework === framework);
    }

    // Filter by requirement ID if specified
    if (requirementId) {
      mappings = mappings.filter(
        (m) =>
          m.pciDssRequirement === requirementId ||
          m.pciDssRequirement.startsWith(requirementId + "."),
      );
    }

    // Get unique frameworks
    const frameworks = [
      ...new Set(mappings.map((m) => m.framework)),
    ].sort();

    return {
      total: mappings.length,
      frameworks,
      mappings: mappings.map((m) => ({
        pciDssRequirement: m.pciDssRequirement,
        framework: m.framework,
        controls: m.controls,
      })),
    };
  },
};
