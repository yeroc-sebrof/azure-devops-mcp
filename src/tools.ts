// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AccessToken } from "@azure/identity";
import { WebApi } from "azure-devops-node-api";

import { configureCoreTools } from "./tools/core.js";
import { configureWorkTools } from "./tools/work.js";
import { configureBuildTools } from "./tools/builds.js";
import { configureRepoTools } from "./tools/repos.js";
import { configureWorkItemTools } from "./tools/workitems.js";
import { configureReleaseTools } from "./tools/releases.js";
import { configureWikiTools } from "./tools/wiki.js";
import { configureTestPlanTools } from "./tools/testplans.js";
import { configureSearchTools } from "./tools/search.js";

export interface ToolConfigOptions {
  disableWorkTools?: boolean;
  disableBuildTools?: boolean;
  disableRepoTools?: boolean;
  disableWorkItemTools?: boolean;
  disableReleaseTools?: boolean;
  disableWikiTools?: boolean;
  disableTestPlanTools?: boolean;
  disableSearchTools?: boolean;
}

function configureAllTools(
  server: McpServer,
  tokenProvider: () => Promise<AccessToken>,
  connectionProvider: () => Promise<WebApi>,
  options: ToolConfigOptions = {}
) {
    // Always configure core tools
    configureCoreTools(server, tokenProvider, connectionProvider);

    // Conditionally configure other tool sets based on options
    if (!options.disableWorkTools) {
      configureWorkTools(server, tokenProvider, connectionProvider);
    }

    if (!options.disableBuildTools) {
      configureBuildTools(server, tokenProvider, connectionProvider);
    }

    if (!options.disableRepoTools) {
      configureRepoTools(server, tokenProvider, connectionProvider);
    }

    if (!options.disableWorkItemTools) {
      configureWorkItemTools(server, tokenProvider, connectionProvider);
    }

    if (!options.disableReleaseTools) {
      configureReleaseTools(server, tokenProvider, connectionProvider);
    }

    if (!options.disableWikiTools) {
      configureWikiTools(server, tokenProvider, connectionProvider);
    }

    if (!options.disableTestPlanTools) {
      configureTestPlanTools(server, tokenProvider, connectionProvider);
    }

    if (!options.disableSearchTools) {
      configureSearchTools(server, tokenProvider, connectionProvider);
    }
}

export { configureAllTools };