import { z } from "zod";
import type { ToolDefinition } from "./base.js";
import { getIndexState, getRequirement } from "../indexer.js";
import { createError } from "../util.js";

const mapToNistSchema = z.object({
  requirementId: z
    .string()
    .describe("PCI-DSS requirement ID to map to NIST 800-53"),
});

export interface MapToNistResult {
  pciDssRequirement: string;
  pciDssTitle: string;
  nistControls: Array<{
    controlId: string;
    controlName: string;
    controlFamily: string;
    mappingType: string;
  }>;
  totalControls: number;
}

export const mapToNist: ToolDefinition<
  typeof mapToNistSchema,
  MapToNistResult
> = {
  name: "map_to_nist",
  description:
    "Map a PCI-DSS requirement to NIST 800-53 Rev. 5 controls. " +
    "Returns all NIST controls that map to the specified PCI-DSS requirement, " +
    "including control families and mapping types (primary, partial, supporting).",
  schema: mapToNistSchema,
  execute: async (args) => {
    const { requirementId } = args;

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

    // Find NIST mappings for this requirement
    const nistMapping = state.controlMappingsData.mappings.find(
      (m) =>
        m.pciDssRequirement === requirementId && m.framework === "NIST-800-53",
    );

    const nistControls = nistMapping ? nistMapping.controls : [];

    return {
      pciDssRequirement: requirementId,
      pciDssTitle: requirement.title,
      nistControls,
      totalControls: nistControls.length,
    };
  },
};
