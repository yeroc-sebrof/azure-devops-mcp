import { AccessToken } from "@azure/identity";
import { describe, expect, it } from '@jest/globals';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { configureWikiTools } from '../../../src/tools/wiki';

type TokenProviderMock = () => Promise<AccessToken>;
type ConnectionProviderMock = () => Promise<WebApi>;
interface WikiApiMock {
  getWiki: jest.Mock;
  getAllWikis: jest.Mock;
  getPagesBatch: jest.Mock;
  getPageText: jest.Mock;
}

describe("configureWikiTools", () => {
  let server: McpServer;
  let tokenProvider: TokenProviderMock;
  let connectionProvider: ConnectionProviderMock;
  let mockConnection: { getWikiApi: jest.Mock };
  let mockWikiApi: WikiApiMock;

  beforeEach(() => {
    server = { tool: jest.fn() } as unknown as McpServer;
    tokenProvider = jest.fn();
    mockWikiApi = {
      getWiki: jest.fn(),
      getAllWikis: jest.fn(),
      getPagesBatch: jest.fn(),
      getPageText: jest.fn(),
    };
    mockConnection = {
      getWikiApi: jest.fn().mockResolvedValue(mockWikiApi),
    };
    connectionProvider = jest.fn().mockResolvedValue(mockConnection);
  });

  describe("tool registration", () => {
    it("registers wiki tools on the server", () => {
      configureWikiTools(server, tokenProvider, connectionProvider);
      expect((server.tool as jest.Mock)).toHaveBeenCalled();
    });
  });

  describe("get_page_content tool", () => {
    it("should call getPageText with the correct parameters and return the expected result", async () => {
      configureWikiTools(server, tokenProvider, connectionProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(
        ([toolName]) => toolName === "wiki_get_page_content"
      );
      if (!call) throw new Error("wiki_get_page_content tool not registered");
      const [, , , handler] = call;

      // Mock a stream-like object for getPageText
      const mockStream = {
        setEncoding: jest.fn(),
        on: function (event: string, cb: (chunk?: unknown) => void) {
          if (event === "data") {
            setImmediate(() => cb("mock page text"));
          }
          if (event === "end") {
            setImmediate(() => cb());
          }
          return this;
        }
      };
      mockWikiApi.getPageText.mockResolvedValue(mockStream as unknown);

      const params = {
        wikiIdentifier: "wiki1",
        project: "proj1",
        path: "/page1"
      };
      
      const result = await handler(params);

      expect(mockWikiApi.getPageText).toHaveBeenCalledWith(
        "proj1",
        "wiki1",
        "/page1", 
        undefined, 
        undefined, 
        true
      );
      expect(result.content[0].text).toBe("\"mock page text\"");
    });
  });

  describe("list_wiki_pages tool", () => {
    it("should call getPagesBatch with the correct parameters and return the expected result", async () => {
      configureWikiTools(server, tokenProvider, connectionProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(
        ([toolName]) => toolName === "wiki_list_pages"
      );
      if (!call) throw new Error("wiki_list_pages tool not registered");
      const [, , , handler] = call;
      mockWikiApi.getPagesBatch.mockResolvedValue({ value: ["page1", "page2"] });

      const params = {
        wikiIdentifier: "wiki2",
        project: "proj2",
        top: 10,
        continuationToken: "token123",
        pageViewsForDays: 7
      };
      const result = await handler(params);
      const parsedResult = JSON.parse(result.content[0].text);
      
      expect(mockWikiApi.getPagesBatch).toHaveBeenCalledWith(
        {
          top: 10,
          continuationToken: "token123",
          pageViewsForDays: 7
        },
        "proj2",
        "wiki2"
      );
      expect(parsedResult.value).toEqual(["page1", "page2"]);
    });
  });
});