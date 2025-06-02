// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AccessToken } from "@azure/identity";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { z } from "zod";
import { TreeStructureGroup } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";

const CORE_TOOLS = {
  list_project_teams: "ado_list_project_teams",
  list_projects: "ado_list_projects",
  list_team_iterations: "ado_list_team_iterations",
  create_iterations: "ado_create_iterations",
  assign_iterations: "ado_assign_iterations",
};

function configureCoreTools(
  server: McpServer,
  tokenProvider: () => Promise<AccessToken>,
  connectionProvider: () => Promise<WebApi>
) {
  
  server.tool(
    CORE_TOOLS.list_project_teams,
    "Retrieve a list of teams for the specified Azure DevOps project.",
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      mine: z.boolean().optional().describe("If true, only return teams that the authenticated user is a member of."),
      top: z.number().optional().describe("The maximum number of teams to return. Defaults to 100."),
      skip: z.number().optional().describe("The number of teams to skip for pagination. Defaults to 0."),     
    },
    async ({ project, mine, top, skip }) => {
      const connection = await connectionProvider();
      const coreApi = await connection.getCoreApi();
      const teams = await coreApi.getTeams(
        project,
        mine,
        top,
        skip,
        false
      );

      return {
        content: [{ type: "text", text: JSON.stringify(teams, null, 2) }],
      };
    }
  );
 
  server.tool(
    CORE_TOOLS.list_projects,
    "Retrieve a list of projects in your Azure DevOps organization.",
    {
      stateFilter: z.enum(["all", "wellFormed", "createPending", "deleted"]).default("wellFormed").describe("Filter projects by their state. Defaults to 'wellFormed'."),
      top: z.number().optional().describe("The maximum number of projects to return. Defaults to 100."),
      skip: z.number().optional().describe("The number of projects to skip for pagination. Defaults to 0."),
      continuationToken: z.number().optional().describe("Continuation token for pagination. Used to fetch the next set of results if available."),      
    },
    async ({ stateFilter, top, skip, continuationToken }) => {
      const connection = await connectionProvider();
      const coreApi = await connection.getCoreApi();
      const projects = await coreApi.getProjects(
        stateFilter,
        top,
        skip,
        continuationToken,
        false
      );

      return {
        content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
      };
    }
  );
  
  server.tool(
    CORE_TOOLS.list_team_iterations,
    "Retrieve a list of iterations for a specific team in a project.",     
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      team: z.string().describe("The name or ID of the Azure DevOps team."),
      timeframe: z.enum(["current"]).optional().describe("The timeframe for which to retrieve iterations. Currently, only 'current' is supported."),
    },
    async ({ project, team, timeframe }) => {
      const connection = await connectionProvider();
      const workApi = await connection.getWorkApi();
      const iterations = await workApi.getTeamIterations(
        { project, team },
        timeframe
      );

      return {
        content: [{ type: "text", text: JSON.stringify(iterations, null, 2) }],
      };
    }
  );

  server.tool(
    CORE_TOOLS.create_iterations,
    "Create new iterations in a specified Azure DevOps project.",     
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      iterations: z.array(z.object({
        iterationName: z.string().describe("The name of the iteration to create."),
        startDate: z.string().optional().describe("The start date of the iteration in ISO format (e.g., '2023-01-01T00:00:00Z'). Optional."),
        finishDate: z.string().optional().describe("The finish date of the iteration in ISO format (e.g., '2023-01-31T23:59:59Z'). Optional.")
      })).describe("An array of iterations to create. Each iteration must have a name and can optionally have start and finish dates in ISO format.")
    },
    async ({ project, iterations }) => {
      const connection = await connectionProvider();
      const workItemTrackingApi = await connection.getWorkItemTrackingApi();

      const results = [];
      for (const { iterationName, startDate, finishDate } of iterations) {
        // Step 1: Create the iteration
        const iteration = await workItemTrackingApi.createOrUpdateClassificationNode(
          {
            name: iterationName,
            attributes: {
              startDate: startDate ? new Date(startDate) : undefined,
              finishDate: finishDate ? new Date(finishDate) : undefined,
            },
          },
          project,
          TreeStructureGroup.Iterations
        );
        results.push(iteration);
      }

      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );
  
  server.tool(
    CORE_TOOLS.assign_iterations,
    "Assign existing iterations to a specific team in a project.",  
    {
      project: z.string().describe("The name or ID of the Azure DevOps project."),
      team: z.string().describe("The name or ID of the Azure DevOps team."),
      iterations: z.array(z.object({
        identifier: z.string().describe("The identifier of the iteration to assign."),
        path: z.string().describe("The path of the iteration to assign, e.g., 'Project/Iteration'.")
      })).describe("An array of iterations to assign. Each iteration must have an identifier and a path."),
    },
    async ({ project, team, iterations }) => {
      const connection = await connectionProvider();
      const workApi = await connection.getWorkApi();

      const teamContext = { project, team };
      const results = [];
      
      for (const { identifier, path } of iterations) {
        const assignment = await workApi.postTeamIteration(
          { path: path, id: identifier },
          teamContext
        );

        results.push(assignment);
      }

      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    }
  );
 
}

export { CORE_TOOLS, configureCoreTools };
