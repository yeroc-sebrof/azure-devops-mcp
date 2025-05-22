# Contribute to Azure DevOps MCP server

You should open this project in local Visual Studio code so that the authentication works well.
You can do this from within this web interface.

You can contribute to our server in the matter of minutes.
Simply ask GitHub Copilot to add the tools you want by referencing a specific Azure DevOps REST API resource you want to use.
This repository contains the instructions for the GitHub Copilot to operate effectively, so don't worry about the prompt specifics.

## Testing your work

You should use MCP Server Inspector to check whether your contribution works correctly in isolation.
You can run `npm run inspect` which will bring up the MCP server inspector web interface.
This is by far the most convinient way of evaluating our MCP server behavior without running actual completions.
Just navigate to `http://localhost:5173` to use it.

Then, you should validate it with in a MCP client. The easiest way is just to open GitHub Copilot and select the right set of tools.
Remember to open the file `.vscode/mcp.json` and press restart icon after you make your changes for them to be available in GitHub Copilot!

### Manual inspection

You can also make requests to the MCP server directly, if you wish:

### Check the tools exposed by this server

`echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | npx -y mcp-server-azuredevops buildcanary | jq`

### Check the resources exposed by this server

`echo '{"jsonrpc":"2.0","method":"resources/list","id":3}' | npx -y mcp-server-azuredevops buildcanary | jq`

### Check the prompts exposed by this server

`echo '{"jsonrpc":"2.0","method":"prompts/list","id":3}' | npx -y mcp-server-azuredevops buildcanary | jq`