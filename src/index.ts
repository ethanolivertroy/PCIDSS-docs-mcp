#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { buildIndex } from "./indexer.js";
import { ensureRepoReady } from "./repo.js";
import { registerTools } from "./tools/register.js";
import { startTimer } from "./util.js";

// Handle CLI commands before starting MCP server
const command = process.argv[2];
if (command === "help" || command === "--help") {
  printHelp();
  process.exit(0);
}

function printHelp(): void {
  console.log(`
PCI-DSS Docs MCP Server

Usage:
  npx pcidss-docs-mcp            Start the MCP server (for MCP clients)
  npx pcidss-docs-mcp help       Show this help message

Environment Variables:
  PCIDSS_DOCS_PATH              Custom path to data directory (default: <project>/data)
  PCIDSS_DOCS_CACHE             Custom cache directory (default: ~/.cache/pcidss-docs)

Examples:
  # Add to Claude Desktop config (~/.claude.json or claude_desktop_config.json):
  {
    "mcpServers": {
      "pcidss-docs": {
        "command": "npx",
        "args": ["pcidss-docs-mcp"]
      }
    }
  }

Learn more: https://github.com/ethanolivertroy/PCIDSS-sucks
`);
}

async function main(): Promise<void> {
  const timer = startTimer();

  // Ensure data directory exists and has converted requirements
  const repoPath = await ensureRepoReady();

  // Build index from requirements.json
  await buildIndex(repoPath);

  const indexMs = timer.stop();

  // Create MCP server
  const server = new McpServer({
    name: "pcidss-docs-mcp",
    version: "0.1.0",
  });

  // Register all tools
  registerTools(server);

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(
    `pcidss-docs-mcp server ready (index built in ${indexMs.toFixed(0)}ms)`,
  );
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
