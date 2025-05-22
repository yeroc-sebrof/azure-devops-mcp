import { AccessToken } from "@azure/identity";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { BuildQueryOrder, DefinitionQueryOrder } from "azure-devops-node-api/interfaces/BuildInterfaces.js";
import { z } from "zod";

const BUILD_TOOLS = { 
  get_build_definitions: "ado_get_build_definitions",
  get_build_definition_revisions: "ado_get_build_definition_revisions",
  get_builds: "ado_get_builds",
  get_build_log: "ado_get_build_log",
  get_build_log_by_id: "ado_get_build_log_by_id",
  get_build_changes: "ado_get_build_changes",
  run_build: "ado_run_build",
  get_build_status: "ado_get_build_status"
};

function configureBuildTools(
  server: McpServer,
  tokenProvider: () => Promise<AccessToken>,
  connectionProvider: () => Promise<WebApi>
) {
    
  /*
    BUILD DEFINITIONS
    Get a list of build definitions for a given project.
  */
  server.tool(
    BUILD_TOOLS.get_build_definitions,
    "Get a list of build definitions for a given project.",
    {
      project: z.string(),
      repositoryId: z.string().optional(),
      repositoryType: z.enum(["TfsGit", "GitHub", "BitbucketCloud"]).optional(),
      name: z.string().optional(),
      path: z.string().optional(),
      queryOrder: z.nativeEnum(DefinitionQueryOrder).optional(),
      top: z.number().optional(),
      continuationToken: z.string().optional(),
      minMetricsTime: z.date().optional(),
      definitionIds: z.array(z.number()).optional(),
      builtAfter: z.date().optional(),
      notBuiltAfter: z.date().optional(),
      includeAllProperties: z.boolean().optional(),
      includeLatestBuilds: z.boolean().optional(),
      taskIdFilter: z.string().optional(),
      processType: z.number().optional(),
      yamlFilename: z.string().optional(),
    },
    async ({
      project,
      repositoryId,
      repositoryType,
      name,
      path,
      queryOrder,
      top,
      continuationToken,
      minMetricsTime,
      definitionIds,
      builtAfter,
      notBuiltAfter,
      includeAllProperties,
      includeLatestBuilds,
      taskIdFilter,
      processType,
      yamlFilename,
    }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const buildDefinitions = await buildApi.getDefinitions(
        project,
        name,
        repositoryId,
        repositoryType,
        queryOrder,
        top,
        continuationToken,
        minMetricsTime,
        definitionIds,
        path,
        builtAfter,
        notBuiltAfter,
        includeAllProperties,
        includeLatestBuilds,
        taskIdFilter,
        processType,
        yamlFilename
      );

      return {
        content: [{ type: "text", text: JSON.stringify(buildDefinitions, null, 2) }],
      };
    }
  );

  /*
    BUILD DEFINITION REVISIONS
    Get a list of revisions for a specific build definition.
  */
  server.tool(
    BUILD_TOOLS.get_build_definition_revisions,
    "Get a list of revisions for a specific build definition.",
    {
      project: z.string(),
      definitionId: z.number(),
    },
    async ({ project, definitionId }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const revisions = await buildApi.getDefinitionRevisions(project, definitionId);

      return {
        content: [{ type: "text", text: JSON.stringify(revisions, null, 2) }],
      };
    }
  );

  /*
    BUILDS - LIST
    Get a list of builds for a given project.
  */
  server.tool(
    BUILD_TOOLS.get_builds,
    "Get a list of builds for a given project.",
    {
      project: z.string(),
      definitions: z.array(z.number()).optional(),
      queues: z.array(z.number()).optional(),
      buildNumber: z.string().optional(),
      minTime: z.date().optional(),
      maxTime: z.date().optional(),
      requestedFor: z.string().optional(),
      reasonFilter: z.number().optional(),
      statusFilter: z.number().optional(),
      resultFilter: z.number().optional(),
      tagFilters: z.array(z.string()).optional(),
      properties: z.array(z.string()).optional(),
      top: z.number().optional(),
      continuationToken: z.string().optional(),
      maxBuildsPerDefinition: z.number().optional(),
      deletedFilter: z.number().optional(),
      queryOrder: z.nativeEnum(BuildQueryOrder).default(BuildQueryOrder.QueueTimeDescending).optional(),
      branchName: z.string().optional(),
      buildIds: z.array(z.number()).optional(),
      repositoryId: z.string().optional(),
      repositoryType: z.enum(["TfsGit", "GitHub", "BitbucketCloud"]).optional(),
    },
    async ({
      project,
      definitions,
      queues,
      buildNumber,
      minTime,
      maxTime,
      requestedFor,
      reasonFilter,
      statusFilter,
      resultFilter,
      tagFilters,
      properties,
      top,
      continuationToken,
      maxBuildsPerDefinition,
      deletedFilter,
      queryOrder,
      branchName,
      buildIds,
      repositoryId,
      repositoryType,
    }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const builds = await buildApi.getBuilds(
        project,
        definitions,
        queues,
        buildNumber,
        minTime,
        maxTime,
        requestedFor,
        reasonFilter,
        statusFilter,
        resultFilter,
        tagFilters,
        properties,
        top,
        continuationToken,
        maxBuildsPerDefinition,
        deletedFilter,
        queryOrder,
        branchName,
        buildIds,
        repositoryId,
        repositoryType
      );

      return {
        content: [{ type: "text", text: JSON.stringify(builds, null, 2) }],
      };
    }
  );

  /*
    BUILDS - GET BUILD LOG
    Get the logs for a specific build.
  */
  server.tool(
    BUILD_TOOLS.get_build_log,
    "Get the logs for a specific build.",
    {
      project: z.string(),
      buildId: z.number(),
    },
    async ({ project, buildId }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const logs = await buildApi.getBuildLogs(project, buildId);

      return {
        content: [{ type: "text", text: JSON.stringify(logs, null, 2) }],
      };
    }
  );

  /*
    BUILDS - GET BUILD LOG BY ID
    Get a specific build log by log ID.
  */
  server.tool(
    BUILD_TOOLS.get_build_log_by_id,
    "Get a specific build log by log ID.",
    {
      project: z.string(),
      buildId: z.number(),
      logId: z.number(),
      startLine: z.number().optional(),
      endLine: z.number().optional(),
    },
    async ({ project, buildId, logId, startLine, endLine }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const logLines = await buildApi.getBuildLogLines(
        project,
        buildId,
        logId,
        startLine,
        endLine
      );

      return {
        content: [{ type: "text", text: JSON.stringify(logLines, null, 2) }],
      };
    }
  );

  /*
    BUILDS - GET BUILD CHANGES
    Get the changes associated with a specific build.
  */
  server.tool(
    BUILD_TOOLS.get_build_changes,
    "Get the changes associated with a specific build.",
    {
      project: z.string(),
      buildId: z.number(),
      continuationToken: z.string().optional(),
      top: z.number().optional(),
      includeSourceChange: z.boolean().optional(),
    },
    async ({ project, buildId, continuationToken, top, includeSourceChange }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const changes = await buildApi.getBuildChanges(
        project,
        buildId,
        continuationToken,
        top,
        includeSourceChange
      );

      return {
        content: [{ type: "text", text: JSON.stringify(changes, null, 2) }],
      };
    }
  );  

  server.tool(
    BUILD_TOOLS.run_build,
    "Triggers a new build for a specified definition.",
    {
      project: z.string(),
      definitionId: z.number(),
    },
    async ({ project, definitionId }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const build = await buildApi.queueBuild({ definition: { id: definitionId } }, project);

      return {
        content: [{ type: "text", text: JSON.stringify(build, null, 2) }],
      };
    }
  );

  server.tool(
    BUILD_TOOLS.get_build_status,
    "Fetches the status of a specific build.",
    {
      project: z.string(),
      buildId: z.number(),
    },
    async ({ project, buildId }) => {
      const connection = await connectionProvider();
      const buildApi = await connection.getBuildApi();
      const build = await buildApi.getBuild(project, buildId);

      return {
        content: [{ type: "text", text: JSON.stringify(build, null, 2) }],
      };
    }
  );
}

export { BUILD_TOOLS, configureBuildTools };
