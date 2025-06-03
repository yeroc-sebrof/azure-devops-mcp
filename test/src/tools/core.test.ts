import { AccessToken } from "@azure/identity";
import { describe, expect, it } from "@jest/globals";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { configureCoreTools } from "../../../src/tools/core";
import { WebApi } from "azure-devops-node-api";
import { TreeStructureGroup } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";


type TokenProviderMock = () => Promise<AccessToken>;
type ConnectionProviderMock = () => Promise<WebApi>;

interface CoreApiMock {
  getTeams: jest.Mock;
  getProjects: jest.Mock;
}

interface WorkApiMock {
  getTeamIterations: jest.Mock;
  postTeamIteration: jest.Mock;
}

interface WorkItemTrackingApiMock {
  createOrUpdateClassificationNode: jest.Mock;
}

describe("configureCoreTools", () => {
  let server: McpServer;
  let tokenProvider: TokenProviderMock;
  let connectionProvider: ConnectionProviderMock;
  let mockConnection: { getCoreApi: jest.Mock; getWorkApi: jest.Mock, getWorkItemTrackingApi: jest.Mock };
  let mockCoreApi: CoreApiMock;
  let mockWorkApi: WorkApiMock;
  let mockWorkItemTrackingApi: WorkItemTrackingApiMock;

  beforeEach(() => {
    server = { tool: jest.fn() } as unknown as McpServer;
    tokenProvider = jest.fn();

    mockCoreApi = {
      getProjects: jest.fn(),
      getTeams: jest.fn(),
    };

    mockWorkApi = {
      getTeamIterations: jest.fn(),
      postTeamIteration: jest.fn(),
    };

    mockWorkItemTrackingApi = {
      createOrUpdateClassificationNode: jest.fn(),
    };

    mockConnection = {
      getCoreApi: jest.fn().mockResolvedValue(mockCoreApi),
      getWorkApi: jest.fn().mockResolvedValue(mockWorkApi),
      getWorkItemTrackingApi: jest.fn().mockResolvedValue(mockWorkItemTrackingApi),
    };

    connectionProvider = jest.fn().mockResolvedValue(mockConnection);
  });

  describe("tool registration", () => {
    it("registers core tools on the server", () => {
      configureCoreTools(server, tokenProvider, connectionProvider);
      expect(server.tool as jest.Mock).toHaveBeenCalled();
    });
  });

  describe("list_projects tool", () => {
    it("should call getProjects API with the correct parameters and return the expected result", async () => {
      configureCoreTools(server, tokenProvider, connectionProvider);

      const call = (server.tool as jest.Mock).mock.calls.find(
        ([toolName]) => toolName === "ado_list_projects"
      );
      if (!call) throw new Error("ado_list_projects tool not registered");
      const [, , , handler] = call;

      (mockCoreApi.getProjects as jest.Mock).mockResolvedValue([
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
        stateFilter: "wellFormed",
        top: undefined,
        skip: undefined,
        continuationToken: undefined,
        getDefaultTeamImageUrl: undefined,
      };

      const result = await handler(params);

      expect(mockCoreApi.getProjects).toHaveBeenCalledWith(
        "wellFormed",
        undefined,
        undefined,
        undefined,
        false
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

  describe("list_project_teams tool", () => {
    it("should call getTeams API with the correct parameters and return the expected result", async () => {
      configureCoreTools(server, tokenProvider, connectionProvider);

      const call = (server.tool as jest.Mock).mock.calls.find(
        ([toolName]) => toolName === "ado_list_project_teams"
      );
      if (!call) throw new Error("ado_list_project_teams tool not registered");
      const [, , , handler] = call;

      (mockCoreApi.getTeams as jest.Mock).mockResolvedValue([
        {
          id: "564e8204-a90b-4432-883b-d4363c6125ca",
          name: "Quality assurance",
          url: "https://dev.azure.com/fabrikam/_apis/projects/eb6e4656-77fc-42a1-9181-4c6d8e9da5d1/teams/564e8204-a90b-4432-883b-d4363c6125ca",
          description: "Testing staff",
          identityUrl:
            "https://vssps.dev.azure.com/fabrikam/_apis/Identities/564e8204-a90b-4432-883b-d4363c6125ca",
        },
        {
          id: "66df9be7-3586-467b-9c5f-425b29afedfd",
          name: "Fabrikam-Fiber-TFVC Team",
          url: "https://dev.azure.com/fabrikam/_apis/projects/eb6e4656-77fc-42a1-9181-4c6d8e9da5d1/teams/66df9be7-3586-467b-9c5f-425b29afedfd",
          description: "The default project team.",
          identityUrl:
            "https://vssps.dev.azure.com/fabrikam/_apis/Identities/66df9be7-3586-467b-9c5f-425b29afedfd",
        },
      ]);

      const params = {
        project: "eb6e4656-77fc-42a1-9181-4c6d8e9da5d1",
        mine: undefined,
        top: undefined,
        skip: undefined,
        expandIdentity: undefined,
      };

      const result = await handler(params);

      expect(mockCoreApi.getTeams).toHaveBeenCalledWith(
        "eb6e4656-77fc-42a1-9181-4c6d8e9da5d1",
        undefined,
        undefined,
        undefined,
        false
      );

      expect(result.content[0].text).toBe(
        JSON.stringify(
          [
            {
              id: "564e8204-a90b-4432-883b-d4363c6125ca",
              name: "Quality assurance",
              url: "https://dev.azure.com/fabrikam/_apis/projects/eb6e4656-77fc-42a1-9181-4c6d8e9da5d1/teams/564e8204-a90b-4432-883b-d4363c6125ca",
              description: "Testing staff",
              identityUrl:
                "https://vssps.dev.azure.com/fabrikam/_apis/Identities/564e8204-a90b-4432-883b-d4363c6125ca",
            },
            {
              id: "66df9be7-3586-467b-9c5f-425b29afedfd",
              name: "Fabrikam-Fiber-TFVC Team",
              url: "https://dev.azure.com/fabrikam/_apis/projects/eb6e4656-77fc-42a1-9181-4c6d8e9da5d1/teams/66df9be7-3586-467b-9c5f-425b29afedfd",
              description: "The default project team.",
              identityUrl:
                "https://vssps.dev.azure.com/fabrikam/_apis/Identities/66df9be7-3586-467b-9c5f-425b29afedfd",
            },
          ],
          null,
          2
        )
      );
    });
  });

  describe("list_team_iterations tool", () => {
    it("should call getTeamIterations API with the correct parameters and return the expected result", async () => {
      configureCoreTools(server, tokenProvider, connectionProvider);

      const call = (server.tool as jest.Mock).mock.calls.find(
        ([toolName]) => toolName === "ado_list_team_iterations"
      );
      if (!call)
        throw new Error("ado_list_team_iterations tool not registered");
      const [, , , handler] = call;

      (mockWorkApi.getTeamIterations as jest.Mock).mockResolvedValue([
        {
          id: "a589a806-bf11-4d4f-a031-c19813331553",
          name: "Sprint 2",
          attributes: {
            startDate: null,
            finishDate: null,
          },
          url: "https://dev.azure.com/fabrikam/6d823a47-2d51-4f31-acff-74927f88ee1e/748b18b6-4b3c-425a-bcae-ff9b3e703012/_apis/work/teamsettings/iterations/a589a806-bf11-4d4f-a031-c19813331553",
        },
      ]);

      const params = {
        project: "fabrikam",
        team: undefined,
        timeframe: undefined,
      };

      const result = await handler(params);

      expect(mockWorkApi.getTeamIterations).toHaveBeenCalledWith(
        { project: "fabrikam", team: undefined },
        undefined
      );

      expect(result.content[0].text).toBe(
        JSON.stringify(
          [
            {
              id: "a589a806-bf11-4d4f-a031-c19813331553",
              name: "Sprint 2",
              attributes: {
                startDate: null,
                finishDate: null,
              },
              url: "https://dev.azure.com/fabrikam/6d823a47-2d51-4f31-acff-74927f88ee1e/748b18b6-4b3c-425a-bcae-ff9b3e703012/_apis/work/teamsettings/iterations/a589a806-bf11-4d4f-a031-c19813331553",
            },
          ],
          null,
          2
        )
      );
    });
  });

  describe("assign_iterations", () => {
    it("should call postTeamIteration API with the correct parameters and return the expected result", async () => {
      configureCoreTools(server, tokenProvider, connectionProvider);

      const call = (server.tool as jest.Mock).mock.calls.find(
        ([toolName]) => toolName === "ado_assign_iterations"
      );
      if (!call) throw new Error("ado_assign_iterations tool not registered");
      const [, , , handler] = call;

      (mockWorkApi.postTeamIteration as jest.Mock).mockResolvedValue({
        id: "a589a806-bf11-4d4f-a031-c19813331553",
        name: "Sprint 2",
        path: "Fabrikam-Fiber\\Release 1\\Sprint 2",
        attributes: {
          startDate: null,
          finishDate: null,
        },
        url: "https://dev.azure.com/fabrikam/6d823a47-2d51-4f31-acff-74927f88ee1e/748b18b6-4b3c-425a-bcae-ff9b3e703012/_apis/work/teamsettings/iterations/a589a806-bf11-4d4f-a031-c19813331553",
      });

      const params = {
        project: "Fabrikam",
        team: "Fabrikam Team",
        iterations: [
          {
            identifier: "a589a806-bf11-4d4f-a031-c19813331553",
            path: "Fabrikam-Fiber\\Release 1\\Sprint 2",
          },
        ],
      };

      const result = await handler(params);

      expect(mockWorkApi.postTeamIteration).toHaveBeenCalledWith(
        {
          id: "a589a806-bf11-4d4f-a031-c19813331553",
          path: "Fabrikam-Fiber\\Release 1\\Sprint 2",
        },
        { 
          project: "Fabrikam", 
          team: "Fabrikam Team" 
        }
      );

      expect(result.content[0].text).toBe(
        JSON.stringify(
          [
            {
              id: "a589a806-bf11-4d4f-a031-c19813331553",
              name: "Sprint 2",
              path: "Fabrikam-Fiber\\Release 1\\Sprint 2",
              attributes: {
                startDate: null,
                finishDate: null,
              },
              url: "https://dev.azure.com/fabrikam/6d823a47-2d51-4f31-acff-74927f88ee1e/748b18b6-4b3c-425a-bcae-ff9b3e703012/_apis/work/teamsettings/iterations/a589a806-bf11-4d4f-a031-c19813331553",
            },
          ],
          null,
          2
        )
      );
    });
  });

 describe("create_iterations", () => {
   it("should call createOrUpdateClassificationNode API with the correct parameters and return the expected result", async () => {
     configureCoreTools(server, tokenProvider, connectionProvider);

     const call = (server.tool as jest.Mock).mock.calls.find(
       ([toolName]) => toolName === "ado_create_iterations"
     );
     if (!call) throw new Error("ado_create_iterations tool not registered");
     const [, , , handler] = call;

     (
       mockWorkItemTrackingApi.createOrUpdateClassificationNode as jest.Mock
     ).mockResolvedValue({
       id: 126391,
       identifier: "a5c68379-3258-4d62-971c-71c1c459336e",
       name: "Web",
       structureType: "area",
       hasChildren: false,
       path: "\\fabrikam\\fiber\\tfvc\\area",
       _links: {
         self: {
           href: "https://dev.azure.com/fabrikam/6ce954b1-ce1f-45d1-b94d-e6bf2464ba2c/_apis/wit/classificationNodes/Areas/Web",
         },
         parent: {
           href: "https://dev.azure.com/fabrikam/6ce954b1-ce1f-45d1-b94d-e6bf2464ba2c/_apis/wit/classificationNodes/Areas",
         },
       },
       url: "https://dev.azure.com/fabrikam/6ce954b1-ce1f-45d1-b94d-e6bf2464ba2c/_apis/wit/classificationNodes/Areas/Web",
     });

     const params = {
       project: "Fabrikam",
       iterations: [
         {
           iterationName: "Sprint 2",
           startDate: "2025-06-02T00:00:00Z",
           finishDate: "2025-06-13T00:00:00Z",
         },
       ],
     };

     const result = await handler(params);

     expect(
       mockWorkItemTrackingApi.createOrUpdateClassificationNode
     ).toHaveBeenCalledWith(
       {
         name: "Sprint 2",
         attributes: {
           startDate: new Date("2025-06-02T00:00:00Z"),
           finishDate: new Date("2025-06-13T00:00:00Z"),
         },
       },
       "Fabrikam",
       TreeStructureGroup.Iterations
     );

     expect(result.content[0].text).toBe(
       JSON.stringify(
         [
           {
             id: 126391,
             identifier: "a5c68379-3258-4d62-971c-71c1c459336e",
             name: "Web",
             structureType: "area",
             hasChildren: false,
             path: "\\fabrikam\\fiber\\tfvc\\area",
             _links: {
               self: {
                 href: "https://dev.azure.com/fabrikam/6ce954b1-ce1f-45d1-b94d-e6bf2464ba2c/_apis/wit/classificationNodes/Areas/Web",
               },
               parent: {
                 href: "https://dev.azure.com/fabrikam/6ce954b1-ce1f-45d1-b94d-e6bf2464ba2c/_apis/wit/classificationNodes/Areas",
               },
             },
             url: "https://dev.azure.com/fabrikam/6ce954b1-ce1f-45d1-b94d-e6bf2464ba2c/_apis/wit/classificationNodes/Areas/Web",
           },
         ],
         null,
         2
       )
     );
   });
 });

});
