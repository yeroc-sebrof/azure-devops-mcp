import { AccessToken } from "@azure/identity";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import {
  ReleaseDefinitionExpands,
  ReleaseDefinitionQueryOrder,
  ReleaseExpands,
  ReleaseStatus,
  ReleaseQueryOrder,
} from "azure-devops-node-api/interfaces/ReleaseInterfaces.js";
import { z } from "zod";

const RELEASE_TOOLS = {
  get_release_definitions: "ado_get_release_definitions",
  get_releases: "ado_get_releases",
};

function configureReleaseTools(
  server: McpServer,
  tokenProvider: () => Promise<AccessToken>,
  connectionProvider: () => Promise<WebApi>
) {
  /*
     RELEASE DEFINITIONS
     Gets a list of release definitions for a given project.
   */
  server.tool(
    RELEASE_TOOLS.get_release_definitions,
    "Gets a list of release definitions for a given project.",
    {
      project: z.string(),
      searchText: z.string().optional(),
      expand: z.nativeEnum(ReleaseDefinitionExpands).default(ReleaseDefinitionExpands.None),
      artifactType: z.string().optional(),
      artifactSourceId: z.string().optional(),
      top: z.number().optional(),
      continuationToken: z.string().optional(),
      queryOrder: z.nativeEnum(ReleaseDefinitionQueryOrder).default(ReleaseDefinitionQueryOrder.NameAscending),
      path: z.string().optional(),
      isExactNameMatch: z.boolean().optional().default(false),
      tagFilter: z.array(z.string()).optional(),
      propertyFilters: z.array(z.string()).optional(),
      definitionIdFilter: z.array(z.string()).optional(),
      isDeleted: z.boolean().default(false),
      searchTextContainsFolderName: z.boolean().optional(),
    },
    async ({
      project,
      searchText,
      expand,
      artifactType,
      artifactSourceId,
      top,
      continuationToken,
      queryOrder,
      path,
      isExactNameMatch,
      tagFilter,
      propertyFilters,
      definitionIdFilter,
      isDeleted,
      searchTextContainsFolderName,
    }) => {
      const connection = await connectionProvider();
      const releaseApi = await connection.getReleaseApi();
      const releaseDefinitions = await releaseApi.getReleaseDefinitions(
        project,
        searchText,
        expand,
        artifactType,
        artifactSourceId,
        top,
        continuationToken,
        queryOrder,
        path,
        isExactNameMatch,
        tagFilter,
        propertyFilters,
        definitionIdFilter,
        isDeleted,
        searchTextContainsFolderName
      );

      return {
        content: [
          { type: "text", text: JSON.stringify(releaseDefinitions, null, 2) },
        ],
      };
    }
  );

  /*
      RELEASES
      Gets a list of releases for a given project.
    */
  server.tool(
    RELEASE_TOOLS.get_releases,
    "Gets a list of releases for a given project.",
    {
      project: z.string().optional(),
      definitionId: z.number().optional(),
      definitionEnvironmentId: z.number().optional(),
      searchText: z.string().optional(),
      createdBy: z.string().optional(),
      statusFilter: z.nativeEnum(ReleaseStatus).optional().default(ReleaseStatus.Active),
      environmentStatusFilter: z.number().optional(),
      minCreatedTime: z.date().optional().default(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return sevenDaysAgo;
      }),
      maxCreatedTime: z.date().optional().default(() => new Date()),
      queryOrder: z.nativeEnum(ReleaseQueryOrder).optional().default(ReleaseQueryOrder.Ascending),
      top: z.number().optional(),
      continuationToken: z.number().optional(),
      expand: z.nativeEnum(ReleaseExpands).optional().default(ReleaseExpands.None),
      artifactTypeId: z.string().optional(),
      sourceId: z.string().optional(),
      artifactVersionId: z.string().optional(),
      sourceBranchFilter: z.string().optional(),
      isDeleted: z.boolean().optional().default(false),
      tagFilter: z.array(z.string()).optional(),
      propertyFilters: z.array(z.string()).optional(),
      releaseIdFilter: z.array(z.number()).optional(),
      path: z.string().optional(),
    },
    async ({
      project,
      definitionId,
      definitionEnvironmentId,
      searchText,
      createdBy,
      statusFilter,
      environmentStatusFilter,
      minCreatedTime,
      maxCreatedTime,
      queryOrder,
      top,
      continuationToken,
      expand,
      artifactTypeId,
      sourceId,
      artifactVersionId,
      sourceBranchFilter,
      isDeleted,
      tagFilter,
      propertyFilters,
      releaseIdFilter,
      path,
    }) => {
      const connection = await connectionProvider();
      const releaseApi = await connection.getReleaseApi();
      const releases = await releaseApi.getReleases(
        project,
        definitionId,
        definitionEnvironmentId,
        searchText,
        createdBy,
        statusFilter,
        environmentStatusFilter,
        minCreatedTime,
        maxCreatedTime,
        queryOrder,
        top,
        continuationToken,
        expand,
        artifactTypeId,
        sourceId,
        artifactVersionId,
        sourceBranchFilter,
        isDeleted,
        tagFilter,
        propertyFilters,
        releaseIdFilter,
        path
      );

      return {
        content: [{ type: "text", text: JSON.stringify(releases, null, 2) }],
      };
    }
  );
}

export { RELEASE_TOOLS, configureReleaseTools };
