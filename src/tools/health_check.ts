import { z } from "zod";

import type { ToolDefinition } from "./base.js";
import { getIndexState } from "../indexer.js";
import type { HealthCheckResult } from "../types.js";

const HealthCheckSchema = z.object({});

type HealthCheckInput = z.infer<typeof HealthCheckSchema>;

export const healthCheckTool: ToolDefinition<
  typeof HealthCheckSchema,
  HealthCheckResult
> = {
  name: "health_check",
  description: "Check the health and status of the PCI-DSS MCP server",
  schema: HealthCheckSchema,
  execute: async (_input: HealthCheckInput) => {
    const state = getIndexState();

    return {
      ok: true,
      documentVersion: state.documentVersion,
      indexedRequirements: state.requirements.size,
      repoPath: state.repoPath,
      errors: state.errors.length > 0 ? state.errors : undefined,
    };
  },
};
