#!/usr/bin/env node

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as azdev from "azure-devops-node-api";
import { AccessToken, DefaultAzureCredential } from "@azure/identity";
import { configurePrompts } from "./prompts.js";
import { configureAllTools, ToolConfigOptions } from "./tools.js";
import { userAgent } from "./utils.js";
import { packageVersion } from "./version.js";
import { minimist } from "minimist";

const argv = minimist(process.argv.slice(2), {
  boolean: [
    'disable-work-tools',
    'disable-build-tools',
    'disable-repo-tools',
    'disable-workitem-tools',
    'disable-release-tools',
    'disable-wiki-tools',
    'disable-testplan-tools',
    'disable-search-tools'
  ]
});

if (argv._.length === 0) {
  console.error(
    "Usage: mcp-server-azuredevops <organization_name> [options]\n" +
    "Options:\n" +
    "  --disable-work-tools\n" +
    "  --disable-build-tools\n" +
    "  --disable-repo-tools\n" +
    "  --disable-workitem-tools\n" +
    "  --disable-release-tools\n" +
    "  --disable-wiki-tools\n" +
    "  --disable-testplan-tools\n" +
    "  --disable-search-tools"
  );
  process.exit(1);
}

export const orgName = argv._[0];
const orgUrl = "https://dev.azure.com/" + orgName;

async function getAzureDevOpsToken(): Promise<AccessToken> {
  process.env.AZURE_TOKEN_CREDENTIALS = "dev";
  const credential = new DefaultAzureCredential(); // CodeQL [SM05138] resolved by explicitly setting AZURE_TOKEN_CREDENTIALS
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
  const server = new McpServer({
    name: "Azure DevOps MCP Server",
    version: packageVersion,
  });

  configurePrompts(server);
  
  const toolConfig: ToolConfigOptions = {
    disableWorkTools: argv['disable-work-tools'],
    disableBuildTools: argv['disable-build-tools'],
    disableRepoTools: argv['disable-repo-tools'],
    disableWorkItemTools: argv['disable-workitem-tools'],
    disableReleaseTools: argv['disable-release-tools'],
    disableWikiTools: argv['disable-wiki-tools'],
    disableTestPlanTools: argv['disable-testplan-tools'],
    disableSearchTools: argv['disable-search-tools']
  };
  
  configureAllTools(
    server,
    getAzureDevOpsToken,
    getAzureDevOpsClient,
    toolConfig
  );

  const transport = new StdioServerTransport();
  console.log("Azure DevOps MCP Server version : " + packageVersion);
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
