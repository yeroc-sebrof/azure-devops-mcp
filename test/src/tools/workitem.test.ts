import { AccessToken } from "@azure/identity";
import { describe, expect, it } from "@jest/globals";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { configureWorkItemTools } from "../../../src/tools/workitems";
import { WebApi } from "azure-devops-node-api";

type TokenProviderMock = () => Promise<AccessToken>;
type ConnectionProviderMock = () => Promise<WebApi>;

interface WorkApiMock {
  getBacklogs: jest.Mock;
  getPredefinedQueryResults: jest.Mock;
  getTeamIterations: jest.Mock;
  getIterationWorkItems: jest.Mock;
}

interface WorkItemTrackingApiMock {
  getWorkItemsBatch: jest.Mock;
  getWorkItem: jest.Mock;  
  getComments: jest.Mock;
  addComment: jest.Mock;
  updateWorkItem: jest.Mock;
  createWorkItem: jest.Mock;  
  getWorkItemType: jest.Mock;
  getQuery: jest.Mock;
  queryById: jest.Mock;
}

describe("configureWorkItemTools", () => {
  let server: McpServer;
  let tokenProvider: TokenProviderMock;
  let connectionProvider: ConnectionProviderMock;
  let mockConnection: { getWorkApi: jest.Mock, getWorkItemTrackingApi: jest.Mock };
  let mockWorkApi: WorkApiMock;
  let mockWorkItemTrackingApi: WorkItemTrackingApiMock;

  beforeEach(() => {
    server = { tool: jest.fn() } as unknown as McpServer;
    tokenProvider = jest.fn();

    mockWorkApi = {
      getBacklogs: jest.fn(),
      getPredefinedQueryResults: jest.fn(),
      getTeamIterations: jest.fn(),
      getIterationWorkItems: jest.fn(),
    };

    mockWorkItemTrackingApi = {
      getWorkItemsBatch: jest.fn(),
      getWorkItem: jest.fn(),
      getComments: jest.fn(),
      addComment: jest.fn(),
      updateWorkItem: jest.fn(),
      createWorkItem: jest.fn(),
      getWorkItemType: jest.fn(),
      getQuery: jest.fn(),
      queryById: jest.fn(),
    };

    mockConnection = {      
      getWorkApi: jest.fn().mockResolvedValue(mockWorkApi),
      getWorkItemTrackingApi: jest.fn().mockResolvedValue(mockWorkItemTrackingApi),
    };

    connectionProvider = jest.fn().mockResolvedValue(mockConnection);
  });

  describe("tool registration", () => {
    it("registers core tools on the server", () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider);
      expect(server.tool as jest.Mock).toHaveBeenCalled();
    });
  });

  describe("list_backlogs tool", () => {
    it("should call getBacklogs API with the correct parameters and return the expected result", async () => {
      configureWorkItemTools(server, tokenProvider, connectionProvider);

      const call = (server.tool as jest.Mock).mock.calls.find(
        ([toolName]) => toolName === "ado_list_backlogs"
      );
      if (!call) throw new Error("ado_list_backlogs tool not registered");
      const [, , , handler] = call;

      (mockWorkApi.getBacklogs as jest.Mock).mockResolvedValue([
        {
          id: "eb6e4656-77fc-42a1-9181-4c6d8e9da5d1",
          name: "Fabrikam-Fiber-TFVC",
          description: "Team Foundation Version Control projects.",
          url: "https://dev.azure.com/fabrikam/_apis/projects/eb6e4656-77fc-42a1-9181-4c6d8e9da5d1",
          state: "wellFormed",
        },
        {
          id: "6ce954b1-ce1f-45d1-b94d-e6bf2464ba2c",
          name: "Fabrikam-Fiber-Git",
          description: "Git projects",
          url: "https://dev.azure.com/fabrikam/_apis/projects/6ce954b1-ce1f-45d1-b94d-e6bf2464ba2c",
          state: "wellFormed",
        },
        {
          id: "281f9a5b-af0d-49b4-a1df-fe6f5e5f84d0",
          name: "TestGit",
          url: "https://dev.azure.com/fabrikam/_apis/projects/281f9a5b-af0d-49b4-a1df-fe6f5e5f84d0",
          state: "wellFormed",
        },
      ]);

      const params = {
        project: "Contoso",
        team: "Fabrikam",
      };

      const result = await handler(params);

      expect(mockWorkApi.getBacklogs).toHaveBeenCalledWith(
        { project: "Contoso", team: "Fabrikam" } 
      );

      expect(result.content[0].text).toBe(
        JSON.stringify(
          [
            {
              id: "eb6e4656-77fc-42a1-9181-4c6d8e9da5d1",
              name: "Fabrikam-Fiber-TFVC",
              description: "Team Foundation Version Control projects.",
              url: "https://dev.azure.com/fabrikam/_apis/projects/eb6e4656-77fc-42a1-9181-4c6d8e9da5d1",
              state: "wellFormed",
            },
            {
              id: "6ce954b1-ce1f-45d1-b94d-e6bf2464ba2c",
              name: "Fabrikam-Fiber-Git",
              description: "Git projects",
              url: "https://dev.azure.com/fabrikam/_apis/projects/6ce954b1-ce1f-45d1-b94d-e6bf2464ba2c",
              state: "wellFormed",
            },
            {
              id: "281f9a5b-af0d-49b4-a1df-fe6f5e5f84d0",
              name: "TestGit",
              url: "https://dev.azure.com/fabrikam/_apis/projects/281f9a5b-af0d-49b4-a1df-fe6f5e5f84d0",
              state: "wellFormed",
            },
          ],
          null,
          2
        )
      );
    });
  });

});
