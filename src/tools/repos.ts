import { AccessToken } from "@azure/identity";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { z } from "zod";

const REPO_TOOLS = {
  list_repos_by_project: "ado_list_repos_by_project",
  list_pull_requests_by_repo: "ado_list_pull_requests_by_repo",
  list_pull_requests_by_project: "ado_list_pull_requests_by_project",
  get_repo_by_id: "ado_get_repo_by_id",
  get_repo_by_name: "ado_get_repo_by_name",
  get_pull_request_by_id: "ado_get_pull_request_by_id",
  create_pull_request: "ado_create_pull_request",
  publish_pull_request: "ado_publish_pull_request",
  abandon_pull_request: "ado_abandon_pull_request",
  reply_to_comment: "ado_reply_to_comment",
  resolve_comment: "ado_resolve_comment",
};

function configureRepoTools(
  server: McpServer,
  tokenProvider: () => Promise<AccessToken>,
  connectionProvider: () => Promise<WebApi>
) {
  /*
    CREATE A NEW PULL REQUEST
    create a new pull request
  */
  server.tool(
    REPO_TOOLS.create_pull_request,
    "Creates a new pull request.",
    {
      repositoryId: z.string(),
      sourceRefName: z.string(),
      targetRefName: z.string(),
      title: z.string(),
      description: z.string().optional(),
      isDraft: z.boolean().optional().default(false),
    },
    async ({
      repositoryId,
      sourceRefName,
      targetRefName,
      title,
      description,
      isDraft,
    }) => {
      const connection = await connectionProvider();
      const gitApi = await connection.getGitApi();
      const pullRequest = await gitApi.createPullRequest(
        {
          sourceRefName,
          targetRefName,
          title,
          description,
          isDraft,
        },
        repositoryId
      );

      return {
        content: [{ type: "text", text: JSON.stringify(pullRequest, null, 2) }],
      };
    }
  );

  /*
    PUBLISH A PULL REQUEST
    publish a pull request by id
  */
  server.tool(
    REPO_TOOLS.publish_pull_request,
    "Publishes an existing pull request.",
    {
      repositoryId: z.string(),
      pullRequestId: z.number(),
    },
    async ({ repositoryId, pullRequestId }) => {
      const connection = await connectionProvider();
      const gitApi = await connection.getGitApi();
      const updatedPullRequest = await gitApi.updatePullRequest(
        { status: 3 }, // 3 corresponds to "Active" status
        repositoryId,
        pullRequestId
      );

      return {
        content: [
          { type: "text", text: JSON.stringify(updatedPullRequest, null, 2) },
        ],
      };
    }
  );

  /*
    ABANDON PULL REQUEST
    Abandons an existing pull request.
  */
  server.tool(
    REPO_TOOLS.abandon_pull_request,
    "Abandons an existing pull request.",
    {
      repositoryId: z.string(),
      pullRequestId: z.number(),
    },
    async ({ repositoryId, pullRequestId }) => {
      const connection = await connectionProvider();
      const gitApi = await connection.getGitApi();
      const abandonedPullRequest = await gitApi.updatePullRequest(
        { status: 2 }, // 2 corresponds to "Abandoned" status
        repositoryId,
        pullRequestId
      );

      return {
        content: [
          { type: "text", text: JSON.stringify(abandonedPullRequest, null, 2) },
        ],
      };
    }
  );

  /*
    REPOS
    Get a list of repositories for a given project.
  */
  server.tool(
    REPO_TOOLS.list_repos_by_project,
    "Get a list of repositories for a given project",
    { project: z.string() },
    async ({ project }) => {
      const connection = await connectionProvider();
      const gitApi = await connection.getGitApi();
      const repositories = await gitApi.getRepositories(
        project,
        false,
        false,
        false
      );

      // Filter out the irrelevant properties
      const filteredRepositories = repositories?.map((repo) => ({
        id: repo.id,
        name: repo.name,
        isDisabled: repo.isDisabled,
        isFork: repo.isFork,
        isInMaintenance: repo.isInMaintenance,
        webUrl: repo.webUrl,
        size: repo.size,
      }));

      return {
        content: [
          { type: "text", text: JSON.stringify(filteredRepositories, null, 2) },
        ],
      };
    }
  );

  /* 
    PULL REQUESTS BY REPO
    Get a list of pull requests for a given repository.
  */
  server.tool(
    REPO_TOOLS.list_pull_requests_by_repo,
    "Get a list of pull requests for a given repository",
    { repositoryId: z.string() },
    async ({ repositoryId }) => {
      const connection = await connectionProvider();
      const gitApi = await connection.getGitApi();
      const searchCriteria = {
        repositoryId: repositoryId,
        status: 1,
      };
      const pullRequests = await gitApi.getPullRequests(
        repositoryId,
        searchCriteria
      );

      // Filter out the irrelevant properties
      const filteredPullRequests = pullRequests?.map((pr) => ({
        pullRequestId: pr.pullRequestId,
        codeReviewId: pr.codeReviewId,
        status: pr.status,
        createdBy: { 
          displayName: pr.createdBy?.displayName,
          uniqueName: pr.createdBy?.uniqueName
        },
        creationDate: pr.creationDate,
        title: pr.title,
        isDraft: pr.isDraft,
      }));

      return {
        content: [
          { type: "text", text: JSON.stringify(filteredPullRequests, null, 2) },
        ],
      };
    }
  );

  /* 
    PULL REQUESTS BY PROJECT
    Get a list of pull requests for a given project.
  */
  server.tool(
    REPO_TOOLS.list_pull_requests_by_project,
    "Get a list of pull requests for a given project",
    { project: z.string() },
    async ({ project }) => {
      const connection = await connectionProvider();
      const gitApi = await connection.getGitApi();
      const gitPullRequestSearchCriteria = {
        status: 1,
      };

      const pullRequests = await gitApi.getPullRequestsByProject(
        project,
        gitPullRequestSearchCriteria
      );

      // Filter out the irrelevant properties
      const filteredPullRequests = pullRequests?.map((pr) => ({
        pullRequestId: pr.pullRequestId,
        codeReviewId: pr.codeReviewId,
        repository: pr.repository?.name,
        status: pr.status,
        createdBy: { 
          displayName: pr.createdBy?.displayName,
          uniqueName: pr.createdBy?.uniqueName
        },
        creationDate: pr.creationDate,
        title: pr.title,
        isDraft: pr.isDraft
      }));

      return {
        content: [
          { type: "text", text: JSON.stringify(filteredPullRequests, null, 2) },
        ],
      };
    }
  );

  /*
    GET REPO BY ID
    Get a repository by its ID.
  */
 server.tool(
    REPO_TOOLS.get_repo_by_id,
    "Get a repository by its ID.",
    { repositoryId: z.string() },
    async ({ repositoryId }) => {
      const connection = await connectionProvider();
      const gitApi = await connection.getGitApi();
      const repository = await gitApi.getRepository(repositoryId);
      return {
        content: [{ type: "text", text: JSON.stringify(repository, null, 2) }],
      };
    }
  );

  /*
    GET REPO BY NAME
    Get a repository by its name.
  */
 server.tool(
    REPO_TOOLS.get_repo_by_name,
    "Get a repository by its name.",
    { project: z.string(), repositoryName: z.string() },
    async ({ project, repositoryName }) => {
      const connection = await connectionProvider();
      const gitApi = await connection.getGitApi();
      const repositories = await gitApi.getRepositories(project);
      const repository = repositories?.find(
        (repo) => repo.name === repositoryName
      );
      if (!repository) {
        throw new Error(`Repository ${repositoryName} not found in project ${project}`);
      }
      return {
        content: [{ type: "text", text: JSON.stringify(repository, null, 2) }],
      };
    }
  );

  /*
    GET PULL REQUEST BY ID
    Get the full information about a pull request by its ID.
  */
 server.tool(
    REPO_TOOLS.get_pull_request_by_id,
    "Get a pull request by its ID.",
    { repositoryId: z.string(), pullRequestId: z.number() },
    async ({ repositoryId, pullRequestId }) => {
      const connection = await connectionProvider();
      const gitApi = await connection.getGitApi();
      const pullRequest = await gitApi.getPullRequest(repositoryId, pullRequestId);
      return {
        content: [{ type: "text", text: JSON.stringify(pullRequest, null, 2) }],
      };
    }
  );

  server.tool(
    REPO_TOOLS.reply_to_comment,
    "Replies to a specific comment on a pull request.",
    {
      repositoryId: z.string(),
      pullRequestId: z.number(),
      threadId: z.number(),
      content: z.string(),
      project: z.string().optional(),

    },
    async ({ repositoryId, pullRequestId, threadId, content, project }) => {
      const connection = await connectionProvider();
      const gitApi = await connection.getGitApi();
      const comment = await gitApi.createComment(
        { content },
        repositoryId,
        pullRequestId,
        threadId,
        project
      );

      return {
        content: [{ type: "text", text: JSON.stringify(comment, null, 2) }],
      };
    }
  );

  /*
    RESOLVE COMMENT
    Resolves a specific comment thread on a pull request.
  */
  server.tool(
    REPO_TOOLS.resolve_comment,
    "Resolves a specific comment thread on a pull request.",
    {
      repositoryId: z.string(),
      pullRequestId: z.number(),
      threadId: z.number(),
    },
    async ({ repositoryId, pullRequestId, threadId }) => {
      const connection = await connectionProvider();
      const gitApi = await connection.getGitApi();
      const thread = await gitApi.updateThread(
        { status: 2 }, // 2 corresponds to "Resolved" status
        repositoryId,
        pullRequestId,
        threadId
      );

      return {
        content: [{ type: "text", text: JSON.stringify(thread, null, 2) }],
      };
    }
  );
}

export { REPO_TOOLS, configureRepoTools };
