import { AccessToken } from "@azure/identity";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { z } from "zod";
import { WikiPagesBatchRequest } from "azure-devops-node-api/interfaces/WikiInterfaces.js";

const WIKI_TOOLS = {  
  list_wikis: "ado_list_wikis",  
  get_wiki: "ado_get_wiki", 
  list_wiki_pages: "ado_list_wiki_pages",
  get_wiki_page: "ado_get_wiki_page"
};

function configureWikiTools(
  server: McpServer,
  tokenProvider: () => Promise<AccessToken>,
  connectionProvider: () => Promise<WebApi>
) {
  
  /*
    GET WIKI
    get wiki details.
  */
  server.tool(
    WIKI_TOOLS.get_wiki,
    "Get the wiki by wikiIdentifier",
    { wikiIdentifier: z.string(), project: z.string().optional() },
    async ({ wikiIdentifier, project }) => {
      const connection = await connectionProvider();
      const wikiApi = await connection.getWikiApi();
   
      const wiki = await wikiApi.getWiki(wikiIdentifier, project);

      return {
        content: [{ type: "text", text: JSON.stringify(wiki, null, 2) }],
      };
    }
  );

  /*
    LIST WIKIS
    list wikis for organization and project
  */
  server.tool(
    WIKI_TOOLS.list_wikis,
    "Get the list of wikis for an organization or project.",
    { project: z.string().optional() },
    async ({ project }) => {
      const connection = await connectionProvider();
      const wikiApi = await connection.getWikiApi();
   
      const wikis = await wikiApi.getAllWikis(project);

      return {
        content: [{ type: "text", text: JSON.stringify(wikis, null, 2) }],
      };
    }
  );

  /*
    LIST WIKI PAGES
    get the list of wiki pages for a specific wiki and project
  */
  server.tool(
    WIKI_TOOLS.list_wiki_pages,
    "Get the list of wiki pages for a specific wiki and project.",
    { 
      wikiIdentifier: z.string(), 
      project: z.string(),
      top: z.number().optional(),
      continuationToken: z.string().optional(),
      pageViewsForDays: z.number().optional()
    },
    async ({ wikiIdentifier, project, top = 20, continuationToken, pageViewsForDays }) => {
      const connection = await connectionProvider();
      const wikiApi = await connection.getWikiApi();
      
      const pagesBatchRequest: WikiPagesBatchRequest = {
        top,
        continuationToken,
        pageViewsForDays
      };

      const pages = await wikiApi.getPagesBatch(
        pagesBatchRequest,
        project,
        wikiIdentifier
      );

      return {
        content: [{ type: "text", text: JSON.stringify(pages, null, 2) }],
      };
    }
  );

  /*
    GET WIKI PAGE
    get a wiki page by path or id
  */
  server.tool(
    WIKI_TOOLS.get_wiki_page,
    "Get wiki page by wikiIdentifier and path.",
    {
      wikiIdentifier: z.string(),
      project: z.string(),     
      path: z.string(),
    },
    async ({ wikiIdentifier, project, path }) => {
      const connection = await connectionProvider();
      const wikiApi = await connection.getWikiApi();
      
      const pageText = await wikiApi.getPageText(
        project,
        wikiIdentifier, 
        path
      );

      return {
        content: [{ type: "text", text: JSON.stringify(pageText, null, 2) }],
      };
    }
  );

}

export { WIKI_TOOLS, configureWikiTools };
