import { AccessToken } from "@azure/identity";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { z } from "zod";
import { TreeStructureGroup } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";

const CORE_TOOLS = {
  list_project_teams: "ado_list_project_teams",
  list_projects: "ado_list_projects",
  list_team_iterations: "ado_list_team_iterations",
  create_iteration: "ado_create_iteration",
  assign_iteration: "ado_assign_iteration",
};

function configureCoreTools(
  server: McpServer,
  tokenProvider: () => Promise<AccessToken>,
  connectionProvider: () => Promise<WebApi>
) {

  /*
    PROJECT TEAMS - LIST
    Get a list of teams for a specific project.
  */
  server.tool(
    CORE_TOOLS.list_project_teams,
    "Get a list of teams for a specific project.",
    {
      projectId: z.string(),
      mine: z.boolean().optional(),
      top: z.number().optional(),
      skip: z.number().optional(),
      expandIdentity: z.boolean().optional(),
    },
    async ({ projectId, mine, top, skip, expandIdentity }) => {
      const connection = await connectionProvider();
      const coreApi = await connection.getCoreApi();
      const teams = await coreApi.getTeams(
        projectId,
        mine,
        top,
        skip,
        expandIdentity
      );

      return {
        content: [{ type: "text", text: JSON.stringify(teams, null, 2) }],
      };
    }
  );

  /*
    PROJECTS - LIST
    Get a list of projects in the organization.  
  */
  server.tool(
    CORE_TOOLS.list_projects,
    "Get a list of projects in the organization.",
    {
      stateFilter: z.enum(["all", "wellFormed", "createPending", "deleted"]).optional(),
      top: z.number().optional(),
      skip: z.number().optional(),
      continuationToken: z.number().optional(),
      getDefaultTeamImageUrl: z.boolean().optional(),
    },
    async ({ stateFilter, top, skip, continuationToken, getDefaultTeamImageUrl }) => {
      const connection = await connectionProvider();
      const coreApi = await connection.getCoreApi();
      const projects = await coreApi.getProjects(
        stateFilter,
        top,
        skip,
        continuationToken,
        getDefaultTeamImageUrl
      );

      return {
        content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
      };
    }
  );

  /*
   ITERATIONS - LIST
   Get a list of iterations for a specific team.
 */
  server.tool(
    CORE_TOOLS.list_team_iterations,
    "Get a list of iterations for a specific team.",
    {
      project: z.string(),
      team: z.string().optional(),
      timeframe: z.enum(["current"]).optional(),
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

  /*
   ASSIGN ITERATION
   Assign an existing iteration to a specific team in a project.
 */
  server.tool(
    CORE_TOOLS.assign_iteration,
    "Assign an existing iteration to a specific team in a project.",
    {
      project: z.string(),
      team: z.string(),
      iterations: z.array(z.object({
        identifier: z.string(),
        path: z.string(),
      }))
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

  /*
    CREATE ITERATION
    Create a new iteration in a specified project.
  */
  server.tool(
    CORE_TOOLS.create_iteration,
    "Create a new iteration in a specified project.",
    {
      project: z.string(),
      iterations: z.array(z.object({
        iterationName: z.string(),
        startDate: z.string().optional(),
        finishDate: z.string().optional()
      }))
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
}

export { CORE_TOOLS, configureCoreTools };
