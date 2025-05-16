import { AccessToken } from "@azure/identity";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { z } from "zod";
import { apiVersion , userAgent } from "../utils.js";
import { orgName } from "../index.js";
import { VersionControlRecursionType } from "azure-devops-node-api/interfaces/GitInterfaces.js";

const SEARCH_TOOLS = {
  code_search: "ado_code_search",
  wiki_search: "ado_wiki_search",
  workitem_search: "ado_workitem_search"
};

function configureSearchTools(
  server: McpServer,
  tokenProvider: () => Promise<AccessToken>,
  connectionProvider: () => Promise<WebApi>
) {
  /*
    CODE SEARCH
    Get the code search results for given search text.
  */
server.tool(
  SEARCH_TOOLS.code_search,
  "Get the code search results for given search text.",
  {
    searchRequest: z.object({
      searchText: z.string(), // search text to find in code
      $skip: z.number().default(0), // number of results to skip (for pagination)
      $top: z.number().default(5), // number of results to return (for pagination)
      filters: z.object({
        Project: z.array(z.string()).optional(), // search in these projects
        Repository: z.array(z.string()).optional(), // search in these repositories
        Path: z.array(z.string()).optional(), // search in these paths
        Branch: z.array(z.string()).optional(), // search in these branches
        CodeElement: z.array(z.string()).optional(), // search for these code elements (e.g., classes, functions, symbols)
        // Note: CodeElement is optional and can be used to filter results by specific code elements.
        // It can be a string or an array of strings.
        // If provided, the search will only return results that match the specified code elements.
        // This is useful for narrowing down the search to specific classes, functions, definitions, or symbols.
        // Example: CodeElement: ["MyClass", "MyFunction"]
      }).partial().optional(),
      includeFacets: z.boolean().optional()
    }).strict()
  },
  async ({  searchRequest }) => {
    const accessToken = await tokenProvider();
    const connection = await connectionProvider();
    const url = `https://almsearch.dev.azure.com/${orgName}/_apis/search/codesearchresults?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken.token}`,
        "User-Agent": `${userAgent}`
      },
      body: JSON.stringify(searchRequest),
    });

    if (!response.ok) {
      throw new Error(`Azure DevOps Code Search API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    const topResults = Array.isArray(json.results)
      ? json.results.slice(0, Math.min(searchRequest.$top, json.results.length))
      : [];

    const gitApi = await connection.getGitApi();
    const combinedResults = await fetchCombinedResults(topResults, gitApi);

    return {
      content: [
        { type: "text", text: JSON.stringify(combinedResults, null, 2) },
        { type: "text", text: JSON.stringify(json, null, 2) }
      ]
    };
  }
);

/*
  WIKI SEARCH
  Get wiki search results for given search text.
*/
server.tool(
  SEARCH_TOOLS.wiki_search,
  "Get wiki search results for given search text.",
  {
    searchRequest: z.object({
      searchText: z.string(),
      $skip: z.number().default(0),
      $top: z.number().default(10),
      filters: z.object({
        Project: z.array(z.string()).optional(),
        Path: z.array(z.string()).optional(),
        Branch: z.array(z.string()).optional(),
      }).partial().optional(),
      includeFacets: z.boolean().optional()
    }).strict()
  },
  async ({ searchRequest }) => {
    const accessToken = await tokenProvider();
    const connection = await connectionProvider();
    const url = `https://almsearch.dev.azure.com/${orgName}/_apis/search/wikisearchresults?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken.token}`,
        "User-Agent": `${userAgent}`
      },
      body: JSON.stringify(searchRequest),
    });

    if (!response.ok) {
      throw new Error(`Azure DevOps Wiki Search API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    return {
      content: [
        { type: "text", text: JSON.stringify(json, null, 2) }
      ]
    };
  }
);

/*
  WORK ITEM SEARCH
  Get work item search results for given search text.
*/
server.tool(
  SEARCH_TOOLS.workitem_search,
  "Get work item search results for given search text.",
  {
    searchRequest: z.object({
      searchText: z.string(),
      $skip: z.number().default(0),
      $top: z.number().default(10),
      filters: z.object({
        "System.TeamProject": z.array(z.string()).optional(),
        "System.AreaPath": z.array(z.string()).optional(),
        "System.WorkItemType": z.array(z.string()).optional(),
        "System.State": z.array(z.string()).optional(),
        "System.AssignedTo": z.array(z.string()).optional(),
      }).partial().optional(),
      includeFacets: z.boolean().optional()
    }).strict()
  },
  async ({ searchRequest }) => {
    const accessToken = await tokenProvider();
    const connection = await connectionProvider();
    const url = `https://almsearch.dev.azure.com/${orgName}/_apis/search/workitemsearchresults?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken.token}`,
        "User-Agent": `${userAgent}`
      },
      body: JSON.stringify(searchRequest),
    });

    if (!response.ok) {
      throw new Error(`Azure DevOps Work Item Search API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    return {
      content: [
        { type: "text", text: JSON.stringify(json, null, 2) }
      ]
    };
  }
);
}

/*
  Fetch git repo file content for top 5(default) search results.
*/
async function fetchCombinedResults(topSearchResults: any[], gitApi: any) {
  const combinedResults = [];
  for (const searchResult of topSearchResults) {
    try {
      const projectId = searchResult.project?.id;
      const repositoryId = searchResult.repository?.id;
      const filePath = searchResult.path;
      const changeId = Array.isArray(searchResult.versions) && searchResult.versions.length > 0 ? searchResult.versions[0].changeId : undefined;
      if (!projectId || !repositoryId || !filePath || !changeId) {
        combinedResults.push({
          error: `Missing projectId, repositoryId, filePath, or changeId in the result: ${JSON.stringify(searchResult)}`,
        });
        continue;
      }

      const versionDescriptor = changeId
        ? { version: changeId, versionType: 2, versionOptions: 0 }
        : undefined;

      const item = await gitApi.getItem(
        repositoryId,
        filePath,
        projectId,
        undefined,
        VersionControlRecursionType.None,
        true, // includeContentMetadata
        false, // latestProcessedChange
        false, // download
        versionDescriptor,
        true, // includeContent
        true, // resolveLfs
        true  // sanitize
      );
      combinedResults.push({
        gitItem: item
      });
    } catch (err) {
      combinedResults.push({
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }
  return combinedResults;
}

export { SEARCH_TOOLS, configureSearchTools };