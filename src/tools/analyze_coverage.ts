import { z } from "zod";
import type { ToolDefinition } from "./base.js";
import { getIndexState, getAllRequirements } from "../indexer.js";
import { createError } from "../util.js";

const analyzeCoverageSchema = z.object({
  framework: z
    .enum(["NIST-800-53", "ISO-27001", "FedRAMP", "CIS", "SOC2"])
    .describe("Framework to analyze coverage for"),
});

export interface AnalyzeCoverageResult {
  framework: string;
  frameworkVersion: string;
  totalPciDssRequirements: number;
  mappedPciDssRequirements: number;
  coveragePercentage: number;
  totalFrameworkControls: number;
  uniqueControls: string[];
  controlFamilies: Array<{
    family: string;
    controlCount: number;
    controls: string[];
  }>;
  mappingTypeBreakdown: {
    primary: number;
    partial: number;
    supporting: number;
  };
}

export const analyzeCoverage: ToolDefinition<
  typeof analyzeCoverageSchema,
  AnalyzeCoverageResult
> = {
  name: "analyze_coverage",
  description:
    "Analyze the coverage of PCI-DSS requirements mapped to a specific framework. " +
    "Provides statistics on mapping coverage, control families, and mapping types. " +
    "Useful for understanding how comprehensive the mappings are and identifying gaps.",
  schema: analyzeCoverageSchema,
  execute: async (args) => {
    const { framework } = args;

    const state = getIndexState();

    if (!state.controlMappingsData) {
      throw createError({
        code: "NOT_FOUND",
        message: "Control mappings data not loaded",
        hint: "Ensure control-mappings.json exists in the data directory",
      });
    }

    // Filter mappings for this framework
    const frameworkMappings = state.controlMappingsData.mappings.filter(
      (m) => m.framework === framework,
    );

    // Count total PCI-DSS requirements
    const totalRequirements = getAllRequirements().length;

    // Count mapped requirements
    const mappedRequirements = new Set(
      frameworkMappings.map((m) => m.pciDssRequirement),
    ).size;

    // Calculate coverage percentage
    const coveragePercentage =
      totalRequirements > 0
        ? Math.round((mappedRequirements / totalRequirements) * 100)
        : 0;

    // Collect all controls
    const allControls: string[] = [];
    const controlsByFamily: Record<string, Set<string>> = {};
    const mappingTypeCounts = { primary: 0, partial: 0, supporting: 0 };

    for (const mapping of frameworkMappings) {
      for (const control of mapping.controls) {
        allControls.push(control.controlId);

        // Group by family
        if (!controlsByFamily[control.controlFamily]) {
          controlsByFamily[control.controlFamily] = new Set();
        }
        controlsByFamily[control.controlFamily].add(control.controlId);

        // Count mapping types
        if (control.mappingType === "primary") {
          mappingTypeCounts.primary++;
        } else if (control.mappingType === "partial") {
          mappingTypeCounts.partial++;
        } else if (control.mappingType === "supporting") {
          mappingTypeCounts.supporting++;
        }
      }
    }

    // Get unique controls
    const uniqueControls = [...new Set(allControls)].sort();

    // Build control families array
    const controlFamilies = Object.entries(controlsByFamily).map(
      ([family, controls]) => ({
        family,
        controlCount: controls.size,
        controls: [...controls].sort(),
      }),
    );

    // Sort by control count (descending)
    controlFamilies.sort((a, b) => b.controlCount - a.controlCount);

    // Get framework version
    const frameworkInfo = state.controlMappingsData.frameworks[framework];
    const frameworkVersion = frameworkInfo?.version || "Unknown";

    return {
      framework,
      frameworkVersion,
      totalPciDssRequirements: totalRequirements,
      mappedPciDssRequirements: mappedRequirements,
      coveragePercentage,
      totalFrameworkControls: allControls.length,
      uniqueControls,
      controlFamilies,
      mappingTypeBreakdown: mappingTypeCounts,
    };
  },
};
