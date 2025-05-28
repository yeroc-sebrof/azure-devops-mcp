Before you get started, ensure you follow the steps in the `README.md` file. This will help you get up and running and connected to your Azure DevOps organization.

## Modify Copilot Instructions

The `.github/copilot-instructions.md` file is a great way to customize the GitHub Copilot experience, especially when working with MCP Server for Azure DevOps.

From the [GitHub documentation](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot):

> Instead of repeatedly adding this contextual detail to your chat questions, you can create a file in your repository that automatically adds this information for you. The additional information is not displayed in the chat but is available to Copilot to allow it to generate higher-quality responses.

### Example Modification

Here is an example modifications we use for getting and updating work items.

```markdown
## Using MCP Server for Azure DevOps

When getting work items using MCP Server for Azure DevOps, always try to use batch tools for updates instead of many individual single updates. For updates, try and update up to 200 updates in a single batch. When getting work items, once you get the list of IDs, use the tool `get_work_items_batch_by_ids` to get the work item details. By default, show fields ID, Type, Title, State. Show work item results in a rendered markdown table.
```

## Sequential Thinking

The [Sequential Thinking](https://mcp.so/server/sequentialthinking) component helps break down complex problems into manageable steps, enabling the LLM to better understand your goals. If you encounter issues with the LLM's responses, consider adding the Sequential Thinking MCP Server to your `.vscode/mcp.json` file:

```json
{
  "servers": {
    "ado": {
      "type": "stdio",
      "command": "mcp-server-azuredevops",
      "args": ["contoso"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

## Different Models

Communicating with the LLM is both an art and a science. If the model does not respond well, switching to a different model may improve your results.

## Examples

### Projects and Teams

Most work item tools require project context. You can retrieve the list of projects and specify the desired project:

```plaintext
get list of ado projects
```

This command returns all Azure DevOps projects for the organization defined in the `mcp.json` file. Similarly, you can retrieve the team context:

```plaintext
get list of teams for project contoso
```

[![MPC Server for Azure DevOps: Get list of projects and teams](https://i9.ytimg.com/vi_webp/y_ri8n7mBlg/mqdefault.webp?sqp=CPjD7sAG&rs=AOn4CLC_vP4RGB4n-umKDZoaSTk8FTamUQ)](https://youtu.be/x579E4_jNtY "MPC Server for Azure DevOps: Get list of projects and teams")

### Get My Work Items

Retrieve a list of work items assigned to you. This tool requires project context:

```plaintext
get my work items for project contoso
```

The model should automatically use the `ado_get_work_items_batch_by_ids` tool to fetch work item details.

[![MPC Server for Azure DevOps: Get my work items](https://i9.ytimg.com/vi_webp/x579E4_jNtY/mqdefault.webp?sqp=CPjD7sAG&rs=AOn4CLDeEq2Fr67GRW81zj3jInz-NSB2BA)](https://youtu.be/y_ri8n7mBlg "MPC Server for Azure DevOps: Get my work items")

### Get Backlog

You need project, team and backlog (Epics, Stories, Features) context in order to get a list of all the work items in a backlog.

```plaintext
get backlogs for Contoso project and Fabrikam Team
```

Once you have the backlog levels, you can then get work items for that backlog.

```plaintext
get list of work items for Feature backlog
```

The model should automatically use the `ado_get_work_items_batch_by_ids` tool to fetch work item details.

[![MPC Server for Azure DevOps: Get backlog](https://i9.ytimg.com/vi/LouuyoscNrI/mqdefault.jpg?sqp=CNzd7sAG-oaymwEmCMACELQB8quKqQMa8AEB-AHUBoAC4AOKAgwIABABGGUgZShlMA8=&rs=AOn4CLCwbaa2CKiyiIfOkpNdHv3fcbIwdA)](https://youtu.be/LouuyoscNrI "MPC Server for Azure DevOps: Get backlog")