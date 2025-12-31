import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerTools as registerToolDefinitions } from "./base.js";
import { listRequirementsTool } from "./list_requirements.js";
import { getRequirementTool } from "./get_requirement.js";
import { healthCheckTool } from "./health_check.js";
import { searchRequirements } from "./search_requirements.js";
import { searchMarkdown } from "./search_markdown.js";
import { getTestingProcedures } from "./get_testing_procedures.js";
import { getComplianceChecklist } from "./get_compliance_checklist.js";
import { getCustomizedApproach } from "./get_customized_approach.js";
import { listControlMappings } from "./list_control_mappings.js";
import { mapToNist } from "./map_to_nist.js";
import { mapToFramework } from "./map_to_framework.js";
import { findByControl } from "./find_by_control.js";
import { analyzeCoverage } from "./analyze_coverage.js";
import { compareVersions } from "./compare_versions.js";
import { getEvidenceExamples } from "./get_evidence_examples.js";

export function registerTools(server: McpServer): void {
  registerToolDefinitions(server, [
    // Phase 1: Basic requirement lookup tools
    listRequirementsTool,
    getRequirementTool,
    healthCheckTool,

    // Phase 3: Search & Assessment tools
    searchRequirements,
    searchMarkdown,
    getTestingProcedures,
    getComplianceChecklist,
    getCustomizedApproach,

    // Phase 4: Control Mapping tools
    listControlMappings,
    mapToNist,
    mapToFramework,
    findByControl,
    analyzeCoverage,

    // Phase 5: Gap Analysis & Polish
    compareVersions,
    getEvidenceExamples,
    // - search_guidance
    // - list_control_mappings
    // - map_to_nist
    // - map_to_framework
    // - find_by_control
    // - analyze_coverage
    // - compare_versions
    // - get_evidence_examples
  ]);
}
