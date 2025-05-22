import { AccessToken } from "@azure/identity";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { WorkItemExpand } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";
import { QueryExpand } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";
import { z } from "zod";
import { batchApiVersion, userAgent } from "../utils.js";

const WORKITEM_TOOLS = {
  my_work_items: "ado_my_work_items",
  list_backlogs: "ado_list_backlogs",    
  list_backlog_work_items: "ado_list_backlog_work_items",   
  get_work_item: "ado_get_work_item",
  get_work_items_batch_by_ids: "ado_get_work_items_batch_by_ids",
  update_work_item: "ado_update_work_item",
  create_work_item: "ado_create_work_item",
  list_work_item_comments: "ado_list_work_item_comments",
  get_work_items_for_current_iteration: "ado_get_work_items_for_current_iteration",
  get_work_items_for_iteration: "ado_get_work_items_for_iteration",
  add_work_item_comment: "ado_add_work_item_comment",
  add_child_work_item: "ado_add_child_work_item",
  update_work_item_assign: "ado_update_work_item_assign", 
  link_work_item_to_pull_request: "ado_link_work_item_to_pull_request",
  get_work_item_type: "ado_get_work_item_type",
  get_query: "ado_get_query", 
  get_query_results_by_id: "ado_get_query_results_by_id",
  update_work_items_batch: "ado_update_work_items_batch",
  close_and_link_workitem_duplicates: "ado_close_and_link_workitem_duplicates"
};

function configureWorkItemTools(
  server: McpServer,
  tokenProvider: () => Promise<AccessToken>,
  connectionProvider: () => Promise<WebApi>
) {
  /*
    BACKLOGS
    Get the list of backlogs for a given project and team.
  */
  server.tool(
    WORKITEM_TOOLS.list_backlogs,
    "Get the list of backlogs for a given project and team.",
    { project: z.string(), team: z.string() },
    async ({ project, team }) => {
      const connection = await connectionProvider();
            const workApi = await connection.getWorkApi();
      const teamContext = { project, team };
      const backlogs = await workApi.getBacklogs(teamContext);

      return {
        content: [{ type: "text", text: JSON.stringify(backlogs, null, 2) }],
      };
    }
  );

  /*
    GET BACKLOG ITEMS
    Get the list of work items for a given backlog
  */
  server.tool(
    WORKITEM_TOOLS.list_backlog_work_items,
    "Get the list of for a given team and backlog category",
    { project: z.string(), team: z.string(), backlogId: z.string() },
    async ({ project, team, backlogId }) => {
      const connection = await connectionProvider();
      const workApi = await connection.getWorkApi();
      const teamContext = { project, team };

      const workItems = await workApi.getBacklogLevelWorkItems(
        teamContext,
        backlogId
      );

      return {
        content: [{ type: "text", text: JSON.stringify(workItems, null, 2) }],
      };
    }
  );

  /*
    WORK ITEMS - MY ACTIVITY / ASSIGNED TO ME
    Get a list of work items relevant to me based on recent activity or assigned to me.
  */
  server.tool(
    WORKITEM_TOOLS.my_work_items,
    "Get a list of work items relevant to me.",
    {
      projectId: z.string(),
      type: z.enum(["assignedtome", "myactivity"]).default("assignedtome"),
      top: z.number().default(50),
      includeCompleted: z.boolean().default(false),
    },
    async ({ projectId, type, top, includeCompleted }) => {
      const connection = await connectionProvider();
      const workApi = await connection.getWorkApi();

      const workItems = await workApi.getPredefinedQueryResults(
        projectId,
        type,
        top,
        includeCompleted
      );

      return {
        content: [{ type: "text", text: JSON.stringify(workItems, null, 2) }],
      };
    }
  );

  /*
    GET WORK ITEMS BATCH
    Get a list of work items in a batch.    
  */
  server.tool(
    WORKITEM_TOOLS.get_work_items_batch_by_ids,
    "Get work items by IDs in batch.",
    { project: z.string(), ids: z.array(z.number()) },
    async ({ project, ids }) => {
      const connection = await connectionProvider();
      const workItemApi = await connection.getWorkItemTrackingApi();
      const workitems = await workItemApi.getWorkItemsBatch({ ids }, project);

      return {
        content: [{ type: "text", text: JSON.stringify(workitems, null, 2) }],
      };
    }
  );

  /*
    GET WORK ITEM
    Get a work item by ID.  
  */
  server.tool(
    WORKITEM_TOOLS.get_work_item,
    "Get a single work item by ID.",
    {
      id: z.number(),
      project: z.string(),
      fields: z.array(z.string()).optional(),
      asOf: z.date().optional(),
      expand: z
        .enum(["all", "fields", "links", "none", "relations"])
        .optional(),
    },
    async ({ id, project, fields, asOf, expand }) => {
      const connection = await connectionProvider();
      const workItemApi = await connection.getWorkItemTrackingApi();
      const workitems = await workItemApi.getWorkItem(
        id,
        fields,
        asOf,
        expand as unknown as WorkItemExpand,
        project
      );
      return {
        content: [{ type: "text", text: JSON.stringify(workitems, null, 2) }],
      };
    }
  );

  /*
    GET COMMENTS
    get the comments for a work item by ID.  
  */
  server.tool(
    WORKITEM_TOOLS.list_work_item_comments,
    "Get comments for a work item by ID.",
    { project: z.string(), workItemId: z.number(), top: z.number().optional() },
    async ({ project, workItemId, top }) => {
      const connection = await connectionProvider();
      const workItemApi = await connection.getWorkItemTrackingApi();
      const comments = await workItemApi.getComments(project, workItemId, top);

      return {
        content: [{ type: "text", text: JSON.stringify(comments, null, 2) }],
      };
    }
  );

  /*
  ADD COMMENT
  add a comment for a work item by ID.  
  */
  server.tool(
    WORKITEM_TOOLS.add_work_item_comment,
    "Add comment to a work item by ID.",
    { project: z.string(), workItemId: z.number(), comment: z.string() },
    async ({ project, workItemId, comment }) => {
      const connection = await connectionProvider();
      const workItemApi = await connection.getWorkItemTrackingApi();
      const commentCreate = { text: comment };
      const commentResponse = await workItemApi.addComment(
        commentCreate,
        project,
        workItemId
      );

      return {
        content: [
          { type: "text", text: JSON.stringify(commentResponse, null, 2) },
        ],
      };
    }
  );

  /*
    ASSIGN WORK ITEM 
    Assign a work item.
  */
  server.tool(
    WORKITEM_TOOLS.update_work_item_assign,
    "Assign a work item by ID.",
    { id: z.number(), project: z.string(), assignedTo: z.string() },
    async ({ id, project, assignedTo }) => {
      const connection = await connectionProvider();
      const workItemApi = await connection.getWorkItemTrackingApi();
      const document = [
        { op: "add", path: "/fields/System.AssignedTo", value: assignedTo },
      ];
      const workitem = await workItemApi.updateWorkItem(
        null,
        document,
        id,
        project
      );

      return {
        content: [{ type: "text", text: JSON.stringify(workitem, null, 2) }],
      };
    }
  );

  /*
    CREATE CHILD WORK ITEM
    Create a child work item from a parent by ID, specifying the work item type, title, and description.
  */
    server.tool(
      WORKITEM_TOOLS.add_child_work_item,
      "Create a child work item from a parent by ID.",
      {
        parentId: z.number(),
        project: z.string(),
        workItemType: z.string(),
        title: z.string(),
        description: z.string(),
        areaPath: z.string().optional(),
        iterationPath: z.string().optional(),
      },
      async ({
        parentId,
        project,
        workItemType,
        title,
        description,
        areaPath,
        iterationPath,
      }) => {
        const connection = await connectionProvider();
        const workItemApi = await connection.getWorkItemTrackingApi();
  
        const document = [
          { 
            op: "add", 
            path: "/fields/System.Title", 
            value: title 
          },
          { 
            op: "add", 
            path: "/fields/System.Description", 
            value: description 
          },       
          {
            op: "add",
            path: "/relations/-",
            value: {
              rel: "System.LinkTypes.Hierarchy-Reverse",
              url: `${connection.serverUrl}/${project}/_apis/wit/workItems/${parentId}`,
            },
          },
        ];
  
        if (areaPath && areaPath.trim().length > 0) {
          document.push({
            op: "add",
            path: "/fields/System.AreaPath",
            value: areaPath,
          });
        }
  
        if (iterationPath && iterationPath.trim().length > 0) {
          document.push({
            op: "add",
            path: "/fields/System.IterationPath",
            value: iterationPath,
          });
        }
  
        const childWorkItem = await workItemApi.createWorkItem(
          null,
          document,
          project,
          workItemType
        );
  
        return {
          content: [
            { type: "text", text: JSON.stringify(childWorkItem, null, 2) },
          ],
        };
      }
    );

  /* 
    LINK WORK ITEM TO PULL REQUEST
    Links a single work item to an existing pull request using ArtifactLink WorkItemRelations.
  */
  server.tool(
    WORKITEM_TOOLS.link_work_item_to_pull_request,
    "Links a single work item to an existing pull request.",
    {
      project: z.string(),
      repositoryId: z.string(),
      pullRequestId: z.number(),
      workItemId: z.number(),
    },
    async ({ project, repositoryId, pullRequestId, workItemId }) => {
      const connection = await connectionProvider();
      const orgUrl = connection.serverUrl;
      const workItemTrackingApi = await connection.getWorkItemTrackingApi();
      try {
        // Create artifact link relation using vstfs format
        // Format: vstfs:///Git/PullRequestId/{project}/{repositoryId}/{pullRequestId}
        const artifactPathValue = `${project}/${repositoryId}/${pullRequestId}`;
        const vstfsUrl = `vstfs:///Git/PullRequestId/${encodeURIComponent(
          artifactPathValue
        )}`;

        // Use the PATCH document format for adding a relation
        const patchDocument = [
          {
            op: "add",
            path: "/relations/-",
            value: {
              rel: "ArtifactLink",
              url: vstfsUrl,
              attributes: {
                name: "Pull Request",
              },
            },
          },
        ];

        // Use the WorkItem API to update the work item with the new relation
        const updatedWorkItem = await workItemTrackingApi.updateWorkItem(
          {},
          patchDocument,
          workItemId,
          project
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  workItemId,
                  pullRequestId,
                  success: true,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        console.error(
          `Error linking work item ${workItemId} to PR ${pullRequestId}:`,
          error
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  workItemId,
                  pullRequestId,
                  success: false,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    }
  );

  /*
    GET WORK ITEMS FOR CURRENT ITERATION
    Get a list of work item for the current iteration
  */
  server.tool(
    WORKITEM_TOOLS.get_work_items_for_current_iteration,
    "Get a list of work items for the current iteration.",
    {
      project: z.string(),
      team: z.string().optional(),
    },
    async ({ project, team }) => {
      const timeframe: "current" = "current";
      const connection = await connectionProvider();
      const workApi = await connection.getWorkApi();

      //get the current iteration for the team
      const iterations = await workApi.getTeamIterations(
        { project, team },
        timeframe
      );

      //get the first iteration id, this should be the only result
      const iterationId = iterations.length > 0 ? iterations[0].id : null;

      if (!iterationId) {
        throw new Error(
          "No current iteration found for the specified project and team."
        );
      }

      //get the work items for the current iteration
      const workItems = await workApi.getIterationWorkItems(
        { project, team },
        iterationId
      );

      return {
        content: [{ type: "text", text: JSON.stringify(workItems, null, 2) }],
      };
    }
  );

  /*
    GET WORK ITEMS AN ITERATION
    Get a list of work items for a specific iteration
  */
  server.tool(
    WORKITEM_TOOLS.get_work_items_for_iteration,
    "Get a list of work items for a specified iteration.",
    {
      project: z.string(),
      team: z.string().optional(),
      iterationId: z.string(),
    },
    async ({ project, team, iterationId }) => {
      const connection = await connectionProvider();
      const workApi = await connection.getWorkApi();

      //get the work items for the current iteration
      const workItems = await workApi.getIterationWorkItems(
        { project, team },
        iterationId
      );

      return {
        content: [{ type: "text", text: JSON.stringify(workItems, null, 2) }],
      };
    }
  );

  /*
    UPDATE WORK ITEM
    Update a work item by ID with specified fields.
  */
  server.tool(
    WORKITEM_TOOLS.update_work_item,
    "Update a work item by ID with specified fields.",
    {
      id: z.number(),
      updates: z.array(
        z.object({
          op: z.enum(["add", "replace", "remove"]).default("add"),
          path: z.string(),
          value: z.string(),
        })
      ),
    },
    async ({ id, updates }) => {
      const connection = await connectionProvider();
      const workItemApi = await connection.getWorkItemTrackingApi();
      const updatedWorkItem = await workItemApi.updateWorkItem(
        null,
        updates,
        id
      );

      return {
        content: [
          { type: "text", text: JSON.stringify(updatedWorkItem, null, 2) },
        ],
      };
    }
  );

  /*
    GET WORK ITEM TYPE
    Get information about a specific work item type.
  */
  server.tool(
    "ado_get_work_item_type",
    "Get information about a specific work item type.",
    {
      project: z.string(),
      workItemType: z.string(),
    },
    async ({ project, workItemType }) => {
      const connection = await connectionProvider();
      const workItemApi = await connection.getWorkItemTrackingApi();

      const workItemTypeInfo = await workItemApi.getWorkItemType(
        project,
        workItemType
      );

      return {
        content: [
          { type: "text", text: JSON.stringify(workItemTypeInfo, null, 2) },
        ],
      };
    }
  );

  /*
      CREATE WORK ITEM
      Create a new work item in a specified project and work item type.
  */
  server.tool(
    WORKITEM_TOOLS.create_work_item,
    "Create a new work item in a specified project and work item type.",
    {
      project: z.string(),
      workItemType: z.string(),
      fields: z.record(z.string(), z.string()),
    },
    async ({ project, workItemType, fields }) => {
      const connection = await connectionProvider();
      const workItemApi = await connection.getWorkItemTrackingApi();

      const document = Object.entries(fields).map(([key, value]) => ({
        op: "add",
        path: `/fields/${key}`,
        value,
      }));

      const newWorkItem = await workItemApi.createWorkItem(
        null,
        document,
        project,
        workItemType
      );

      return {
        content: [{ type: "text", text: JSON.stringify(newWorkItem, null, 2) }],
      };
    }
  );

  /*
    GET QUERY 
    Get an individual query and its children by ID or path.
  */
  server.tool(
    WORKITEM_TOOLS.get_query,
    "Get the details of a query by its ID or path.",
    {
      project: z.string(),
      query: z.string(),
      expand: z.enum(["all", "clauses", "minimal", "none", "wiql"]).optional(),
      depth: z.number().optional(),
      includeDeleted: z.boolean().optional(),
      useIsoDateFormat: z.boolean().optional(),
    },
    async ({
      project,
      query,
      expand,
      depth,
      includeDeleted,
      useIsoDateFormat,
    }) => {
      const connection = await connectionProvider();
      const workItemApi = await connection.getWorkItemTrackingApi();

      const queryDetails = await workItemApi.getQuery(
        project,
        query,
        expand as unknown as QueryExpand,
        depth,
        includeDeleted,
        useIsoDateFormat
      );

      return {
        content: [
          { type: "text", text: JSON.stringify(queryDetails, null, 2) },
        ],
      };
    }
  );

  /*
    GET QUERY RESULTS BY ID
    Get the results of a query given the query ID.
  */
  server.tool(
    WORKITEM_TOOLS.get_query_results_by_id,
    "Get the results of a query given the query ID.",
    {
      id: z.string(),
      project: z.string().optional(),
      team: z.string().optional(),
      timePrecision: z.boolean().optional(),
      top: z.number().default(50),
    },
    async ({ id, project, team, timePrecision, top }) => {
      const connection = await connectionProvider();
      const workItemApi = await connection.getWorkItemTrackingApi();
      const teamContext = { project, team };
      const queryResult = await workItemApi.queryById(
        id,
        teamContext,
        timePrecision,
        top
      );

      return {
        content: [{ type: "text", text: JSON.stringify(queryResult, null, 2) }],
      };
    }
  );

  /*
    UPDATE WORK ITEMS BATCH
    Update multiple work items in batch with specified fields.
  */
  server.tool(
    WORKITEM_TOOLS.update_work_items_batch,
    "Update work items in batch",
    {
      updates: z.array(
        z.object({
          op: z.enum(["add", "replace", "remove"]).default("add"),
          id: z.number(),
          path: z.string(),
          value: z.string(),
        })
      ),
    },
    async ({ updates }) => {
      const connection = await connectionProvider();
      const orgUrl = connection.serverUrl;
      const accessToken = await tokenProvider();

      // Extract unique IDs from the updates array
      const uniqueIds = Array.from(new Set(updates.map((update) => update.id)));

      const body = uniqueIds.map((id) => ({
        method: "PATCH",
        uri: `/_apis/wit/workitems/${id}?api-version=${batchApiVersion}`,
        headers: {
          "Content-Type": "application/json-patch+json",
        },
        body: updates.filter((update) => update.id === id).map(({ op, path, value }) => ({
            op: op,
            path: path,
            value: value,
          })),
      }));     

      const response = await fetch(
        `${orgUrl}/_apis/wit/$batch?api-version=${batchApiVersion}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken.token}`,
            "Content-Type": "application/json",
            "User-Agent": `${userAgent}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update work items in batch: ${response.statusText}`
        );
      }

      const result = await response.json();

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  /*
    CLOSE AND LINK WORK ITEM DUPLICATES
    Close out duplicate work items and link back to the winning duplicate of
  */
  server.tool (
    WORKITEM_TOOLS.close_and_link_workitem_duplicates,
    "Close duplicate work items by id.",
    {
      id: z.number(),
      duplicateIds: z.array(z.number()),
      project: z.string(),
      state: z.string(),
    },
    async ({ id, duplicateIds, project, state }) => {
      const connection = await connectionProvider();

      const body = duplicateIds.map((duplicateId) => ({
        method: "PATCH",
        uri: `/_apis/wit/workitems/${duplicateId}?api-version=${batchApiVersion}`,
        headers: {
          "Content-Type": "application/json-patch+json",
        },
        body: [
          {
            op: "add",
            path: "/fields/System.State",
            value: `${state}`,
          },
          {
            op: "add",
            path: "/relations/-",
            value: {
              rel: "System.LinkTypes.Duplicate-Reverse",
              url: `${connection.serverUrl}/${project}/_apis/wit/workItems/${id}`,
            },
          },
        ],
      }));

      const accessToken = await tokenProvider();

      const response = await fetch(
        `${connection.serverUrl}/_apis/wit/$batch?api-version=${batchApiVersion}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken.token}`,
            "Content-Type": "application/json",
            "User-Agent": `${userAgent}`,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update work items in batch: ${response.statusText}`
        );
      }

      const result = await response.json();

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}

export { WORKITEM_TOOLS, configureWorkItemTools };
