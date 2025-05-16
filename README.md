# azure-devops-mcp

> Please note that this project is in Public Preview and implementation may significantly change prior to our General Availability.

This typescript project contains the definition of the **local** MCP server for Azure DevOps.
You can use this from within your code editor to perform simple or more advanced tasks which include your Azure DevOps organization.
Make sure to configure your repository once, so that anyone can use these tools automatically.

### Learn More and Get Support

Here is some additional helpful information:
 - [How to guide](./docs/how-to.md)
 - [Troubleshooting](./docs/Troubleshooting.md)

For further assistance, refer to our **[Support Documentation](./SUPPORT.md)**.

## How to contribute

All work on the Azure DevOps MCP Server happens directly on GitHub. Both core team members and external contributors send pull requests which go through the same review process.

Please make sure to review and adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md) when contributing to this project.

If you are interested in fixing issues (or adding functionality) and contributing directly to the code base, check out the [contributions guide](./CONTRIBUTING.md).

## Getting Started

Clone this repository, install the content and add it to your MCP client configuration.

### Prerequisites

- Node20
- MCP client

### Installing

For now this package is installed locally into npm binaries directory.

```pwsh
npm install; npm install -g .
```

## How to use
You can run it either locally or remotely. The package is also available on our internal <Feed> feed under mseng (internal).
Note: When starting the server, remember to update the `mseng` parameter in `mcp.json` to match your organization.

### Remotely 
[![Open in GitHub Codespaces]](update_link)

Use our Github Codespace and [check the demo]()

### Running server from source code 

1. Checkout the repository.
2. Install dependencies using npm:
```pwsh
npm install; npm install -g .
```
If you encounter authentication issues, ensure your npm registry is set to the public registry. You can check and update it with the following commands:
```pwsh
# Check the current registry
npm config get registry

# If not set to npmjs, update it to the public registry
npm config set registry https://registry.npmjs.org/
```
3. Open the **`.vscode/mcp.json`** file
4. Replace the *mseng* value with your organization name (the one used in `https://dev.azure.com/<organization-name>/`).
5. Start your server.
6. In your chat, switch to [Agent Mode](https://code.visualstudio.com/blogs/2025/02/24/introducing-copilot-agent-mode)
7. Click "Add Context" and include all available tools that begin with ado_.

### Runing server from exported package (requires access) 
**Notes**: 
* To access this, you must have access to <FEED>.
* If you wish to connect to this feed, please be aware that it is an internal feed and is not available for external access. You can track updates here: [azure-devops-mcp Issue #114](<public_rempo>).

1. Set registry:
````pwsh
npm config set registry <FEED>
````
2. Install package
````pwsh
npm install @modelcontextprotocol/server-azuredevops@0.1.0 
````
3. Ingest your mcp.json at your `.vscode/`
````json
{
    "servers": {
        "ado": {
            "type": "stdio",
            "command": "npx",
            "args": [
                "-y",
                "@modelcontextprotocol/server-azuredevops",
                "mseng"
            ]
        }
    }
}
````
4. Replace the mseng value with your organization name (the one used in `https://dev.azure.com/<organization-name>/`).
5. Open on `.vscode/mcp.json` 
6. Click on `Run Server`
7. Switch to agent mode in your chat: [Introducing GitHub Copilot agent mode (preview)](https://code.visualstudio.com/blogs/2025/02/24/introducing-copilot-agent-mode?ref=baus-net)
8. Click on 'Add Context' and include the available tools that start with ado_.
9. Ask a question or make a request.

### Troubleshooting

For detailed troubleshooting steps, refer to the [Troubleshooting Guide](./docs/Troubleshooting.md).

### Deployment (CI/CD)

1. **Releases**
   - Release tags are created for stable versions. New versions are released manually after stability is confirmed
   - Same for pipeline, we have a scheduling a scheduled Azure DevOps pipeline builds and publishes the latest stable version to the <FEED> npm feed every Monday. Currently, we are not publishing on scheduled runs though, we publish after stability is confirmed.

2. **Artifact Publishing**
   Artifacts are published to the <FEED> npm feed:
   - Registry: <REGISTRY> (ADO org only)
   - Artifacts include the MCP server package for Azure DevOps.
   - We are in the process of publishing in a new feed which will be exposed internally to Microsoft: [#114](<public_rempo>).

## Access

The MCP server will need to talk to Azure DevOps organization that you chose and use local `az` context to do this.

### Testing individual tools

`echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"wit_get_backlog_level_work_items","arguments":{"project":"ggurgul", "team": "ggurgul Team", "backlogLevel": "Feature"}},"id":1}' | npx -y mcp-server-azuredevops buildcanary 2>server.log | jq`

### Support & Reuse Expectations

_The creators of this repository **DO NOT EXPECT REUSE**._

## How to Accomplish Common User Actions

- [modelcontextprotocol.io](https://modelcontextprotocol.io/quickstart/user#server-not-showing-up-in-claude-hammer-icon-missing)

# Tools

### Core

- **ado_list_project_teams**: Get a list of teams for a specific project.
- **ado_list_projects**: Get a list of projects in the organization.
- **ado_list_team_iterations**: Get a list of iterations for a specific team.

### Work Items

- **ado_my_work_items**: Get a list of work items relevant to me.
- **ado_list_backlogs**: Get the list of backlogs for a given project and team.
- **ado_list_backlog_work_items**: Get the list of for a given team and backlog category
- **ado_get_work_item**: Get a single work item by ID.
- **ado_get_work_items_batch_by_ids**: Get work items by IDs in batch.
- **ado_update_work_item**: Update a work item by ID with specified fields.
- **ado_create_work_item**: Create a new work item in a specified project and work item type.
- **ado_list_work_item_comments**: Get comments for a work item by ID.
- **ado_get_work_items_for_current_iteration**: Get a list of work items for the current iteration.
- **ado_get_work_items_for_iteration**: Get a list of work items for a specified iteration.
- **ado_add_work_item_comment**: Add comment to a work item by ID.
- **ado_add_child_work_item**: Create a child work item from a parent by ID.
- **ado_update_work_item_assign**: Assign a work item by ID.
- **ado_link_work_item_to_pull_request**: Links a single work item to an existing pull request.
- **ado_get_work_item_type**: Get information about a specific work item type.
- **ado_get_query**: Get the details of a query by its ID or path.
- **ado_get_query_results_by_id**: Get the results of a query given the query ID.
- **ado_update_work_items_batch**: Update work items in batch.
- **ado_close_and_link_workitem_duplicates**: Close duplicate work items by id.

### Repositories

- **ado_list_repos_by_project**: Get a list of repositories for a given project.
- **ado_list_pull_requests_by_repo**: Get a list of pull requests for a given repository.
- **ado_list_pull_requests_by_project**: Get a list of pull requests for a given project.
- **ado_create_pull_request**: Creates a new pull request.
- **ado_publish_pull_request**: Publishes an existing pull request.
- **ado_abandon_pull_request**: Abandons an existing pull request.
- **ado_reply_to_comment**: Replies to a specific comment on a pull request.
- **ado_resolve_comment**: Resolves a specific comment thread on a pull request.

### Builds

- **ado_get_build_definitions**: Get a list of build definitions for a given project.
- **ado_get_build_definition_revisions**: Get a list of revisions for a specific build definition.
- **ado_get_builds**: Get a list of builds for a given project.
- **ado_get_build_log**: Get the logs for a specific build.
- **ado_get_build_log_by_id**: Get a specific build log by log ID.
- **ado_get_build_changes**: Get the changes associated with a specific build.
- **ado_run_build**: Triggers a new build for a specified definition.
- **ado_get_build_status**: Fetches the status of a specific build.

### Releases

- **ado_get_release_definitions**: Gets a list of release definitions for a given project.
- **ado_get_releases**: Gets a list of releases for a given project.

### Test Plans

- **ado_create_test_plan**: Creates a new test plan in the project.
- **ado_create_test_case**: Creates a new test case work item in the project.
- **ado_add_test_cases_to_suite**: Adds existing test cases to a test suite.
- **ado_show_test_results_from_build_id**: Gets a list of test results in the project.
- **ado_list_test_cases**: Gets a list of test cases in the test plan.

### Wiki

- **ado_list_wikis**: Get the list of wikis for an organization or project.
- **ado_get_wiki**: Get the wiki by wikiIdentifier.
- **ado_list_wiki_pages**: Get the list of wiki pages for a specific wiki and project.
- **ado_get_wiki_page**: Get wiki page by wikiIdentifier and path.

### Search

- **ado_code_search**: Get code search results for the given search text.
- **ado_wiki_search**: Get wiki search results for the given search text.
- **ado_workitem_search**: Get workitem search results for the given search text.

## License
This project is licensed under the [MIT License](./LICENSE.md). For complete details, please refer to full terms. 

-------

_Trademarks: This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow Microsoft’s Trademark & Brand Guidelines. Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party’s policies._

<!-- version: 2023-04-07 [Do not delete this line, it is used for analytics that drive template improvements] -->
