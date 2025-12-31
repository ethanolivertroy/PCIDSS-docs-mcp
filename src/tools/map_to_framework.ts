import { z } from "zod";
import type { ToolDefinition } from "./base.js";
import { getIndexState, getRequirement } from "../indexer.js";
import { createError } from "../util.js";

const mapToFrameworkSchema = z.object({
  requirementId: z
    .string()
    .describe("PCI-DSS requirement ID to map"),
  framework: z
    .enum(["NIST-800-53", "ISO-27001", "FedRAMP", "CIS", "SOC2"])
    .describe("Target framework to map to"),
});

export interface MapToFrameworkResult {
  pciDssRequirement: string;
  pciDssTitle: string;
  framework: string;
  frameworkVersion: string;
  controls: Array<{
    controlId: string;
    controlName: string;
    controlFamily: string;
    mappingType: string;
  }>;
  totalControls: number;
}

export const mapToFramework: ToolDefinition<
  typeof mapToFrameworkSchema,
  MapToFrameworkResult
> = {
  name: "map_to_framework",
  description:
    "Map a PCI-DSS requirement to controls in other security frameworks. " +
    "Supports NIST 800-53, ISO 27001, FedRAMP, CIS Controls v8, and SOC2. " +
    "Returns all controls in the target framework that map to the PCI-DSS requirement.",
  schema: mapToFrameworkSchema,
  execute: async (args) => {
    const { requirementId, framework } = args;

    const state = getIndexState();

    // Verify requirement exists
    const requirement = getRequirement(requirementId);
    if (!requirement) {
      throw createError({
        code: "NOT_FOUND",
        message: `PCI-DSS requirement ${requirementId} not found`,
        hint: "Check the requirement ID format (e.g., '1', '1.2', '1.2.3')",
      });
    }

    if (!state.controlMappingsData) {
      throw createError({
        code: "NOT_FOUND",
        message: "Control mappings data not loaded",
        hint: "Ensure control-mappings.json exists in the data directory",
      });
    }

    // Find mapping for this requirement and framework
    const mapping = state.controlMappingsData.mappings.find(
      (m) =>
        m.pciDssRequirement === requirementId && m.framework === framework,
    );

    const controls = mapping ? mapping.controls : [];

    // Get framework version
    const frameworkInfo = state.controlMappingsData.frameworks[framework];
    const frameworkVersion = frameworkInfo?.version || "Unknown";

    return {
      pciDssRequirement: requirementId,
      pciDssTitle: requirement.title,
      framework,
      frameworkVersion,
      controls,
      totalControls: controls.length,
    };
  },
};
