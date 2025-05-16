#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as azdev from "azure-devops-node-api";
import { AccessToken, DefaultAzureCredential } from "@azure/identity";
import { configurePrompts } from "./prompts.js";
import { configureAllTools } from "./tools.js";
import { userAgent } from "./utils.js";
import { packageVersion } from "./version.js";
const args = process.argv.slice(2);
if (args.length === 0) {  console.error(
    "Usage: mcp-server-azuredevops <organization_name>"
  );
  process.exit(1);
}

export const orgName = args[0];
const orgUrl = "https://dev.azure.com/" + orgName;

async function getAzureDevOpsToken(): Promise<AccessToken> {
  const credential = new DefaultAzureCredential();
  const token = await credential.getToken("499b84ac-1321-427f-aa17-267ca6975798/.default");
  return token;
}

async function getAzureDevOpsClient() : Promise<azdev.WebApi> {
  const token = await getAzureDevOpsToken();
  const authHandler = azdev.getBearerHandler(token.token);
  const connection = new azdev.WebApi(orgUrl, authHandler, undefined, {
    productName: "AzureDevOps.MCP",
    productVersion: packageVersion,
    userAgent: userAgent
  });
  return connection;
}

async function main() {
  console.error("Starting Azure DevOps MCP Server...");
  const server = new McpServer({
    name: "Azure DevOps MCP Server",
    version: "1.0.0",
  });

  configurePrompts(server);
  
  configureAllTools(
    server,
    getAzureDevOpsToken,
    getAzureDevOpsClient
  );

  const transport = new StdioServerTransport();
  console.error("Connecting server to transport...");
  await server.connect(transport);
  console.error("Azure DevOps MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
