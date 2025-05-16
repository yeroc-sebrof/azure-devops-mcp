import { AccessToken } from "@azure/identity";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import {
  TestPlanCreateParams,
  TestCase,
} from "azure-devops-node-api/interfaces/TestPlanInterfaces.js";
import { z } from "zod";

const Test_Plan_Tools = {
  create_test_plan: "ado_create_test_plan",
  create_test_case: "ado_create_test_case",
  add_test_cases_to_suite: "ado_add_test_cases_to_suite",
  test_results_from_build_id: "ado_show_test_results_from_build_id",
  list_test_cases: "ado_list_test_cases",
  list_test_plans: "ado_list_test_plans"
};

function configureTestPlanTools(
  server: McpServer,
  tokenProvider: () => Promise<AccessToken>,
  connectionProvider: () => Promise<WebApi>
) {
  /*
    LIST OF TEST PLANS
    get list of test plany by project
  */
  server.tool(
    Test_Plan_Tools.list_test_plans,
    "List of test plans by project",
    {
      project: z.string(),
      filterActivePlans: z.boolean().default(true),
      includePlanDetails: z.boolean().default(false),
      continuationToken: z.string().optional(),
    },
    async ({
      project,
      filterActivePlans,
      includePlanDetails,
      continuationToken,
    }) => {
      const owner = ""; //making owner an empty string untill we can figure out how to get owner id
      const connection = await connectionProvider();
      const testPlanApi = await connection.getTestPlanApi();

      const testPlans = await testPlanApi.getTestPlans(
        project,
        owner,
        continuationToken,
        includePlanDetails,
        filterActivePlans
      );

      return {
        content: [{ type: "text", text: JSON.stringify(testPlans, null, 2) }],
      };
    }
  );

  /*
    Create Test Plan - CREATE
  */
  server.tool(
    Test_Plan_Tools.create_test_plan,
    "Creates a new test plan in the project.",
    {
      project: z.string(),
      name: z.string(),
      iteration: z.string(),
      description: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      areaPath: z.string().optional(),
    },
    async ({
      project,
      name,
      iteration,
      description,
      startDate,
      endDate,
      areaPath,
    }) => {
      const connection = await connectionProvider();
      const testPlanApi = await connection.getTestPlanApi();

      const testPlanToCreate: TestPlanCreateParams = {
        name,
        iteration,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        areaPath,
      };

      const createdTestPlan = await testPlanApi.createTestPlan(
        testPlanToCreate,
        project
      );

      return {
        content: [
          { type: "text", text: JSON.stringify(createdTestPlan, null, 2) },
        ],
      };
    }
  );

  /*
    Add Test Cases to Suite - ADD
  */
  server.tool(
    Test_Plan_Tools.add_test_cases_to_suite,
    "Adds existing test cases to a test suite.",
    {
      project: z.string(),
      planId: z.number(),
      suiteId: z.number(),
      testCaseIds: z.string().or(z.array(z.string())), // Accept either a comma-separated string or an array
    },
    async ({ project, planId, suiteId, testCaseIds }) => {
      const connection = await connectionProvider();
      const testApi = await connection.getTestApi();

      // If testCaseIds is an array, convert it to comma-separated string
      const testCaseIdsString = Array.isArray(testCaseIds)
        ? testCaseIds.join(",")
        : testCaseIds;

      const addedTestCases = await testApi.addTestCasesToSuite(
        project,
        planId,
        suiteId,
        testCaseIdsString
      );

      return {
        content: [
          { type: "text", text: JSON.stringify(addedTestCases, null, 2) },
        ],
      };
    }
  );

  /*
    Create Test Case - CREATE
  */
  server.tool(
    Test_Plan_Tools.create_test_case,
    "Creates a new test case work item.",
    {
      project: z.string(),
      title: z.string(),
      steps: z.string().optional(),
      priority: z.number().optional(),
      areaPath: z.string().optional(),
      iterationPath: z.string().optional(),
    },
    async ({ project, title, steps, priority, areaPath, iterationPath }) => {
      const connection = await connectionProvider();
      const witClient = await connection.getWorkItemTrackingApi();

      let stepsXml;
      if (steps) {
        stepsXml = convertStepsToXml(steps);
      }

      // Create JSON patch document for work item
      const patchDocument = [];

      patchDocument.push({
        op: "add",
        path: "/fields/System.Title",
        value: title,
      });

      if (stepsXml) {
        patchDocument.push({
          op: "add",
          path: "/fields/Microsoft.VSTS.TCM.Steps",
          value: stepsXml,
        });
      }

      if (priority) {
        patchDocument.push({
          op: "add",
          path: "/fields/Microsoft.VSTS.Common.Priority",
          value: priority,
        });
      }

      if (areaPath) {
        patchDocument.push({
          op: "add",
          path: "/fields/System.AreaPath",
          value: areaPath,
        });
      }

      if (iterationPath) {
        patchDocument.push({
          op: "add",
          path: "/fields/System.IterationPath",
          value: iterationPath,
        });
      }

      const workItem = await witClient.createWorkItem(
        {},
        patchDocument,
        project,
        "Test Case"
      );

      return {
        content: [{ type: "text", text: JSON.stringify(workItem, null, 2) }],
      };
    }
  );

  /* 
    TEST PLANS
    Gets a list of test cases for a given testplan.
  */
  server.tool(
    Test_Plan_Tools.list_test_cases,
    "Gets a list of test cases in the test plan.",
    {
      project: z.string(),
      planid: z.number(),
      suiteid: z.number(),
    },
    async ({ project, planid, suiteid }) => {
      const connection = await connectionProvider();
      const coreApi = await connection.getTestPlanApi();
      const testcases = await coreApi.getTestCaseList(project, planid, suiteid);

      return {
        content: [{ type: "text", text: JSON.stringify(testcases, null, 2) }],
      };
    }
  );

  /*
    Test results list - LIST
  */
  server.tool(
    Test_Plan_Tools.test_results_from_build_id,
    "Gets a list of test results in the project.",
    {
      project: z.string(),
      buildid: z.number(),
    },
    async ({ project, buildid }) => {
      const connection = await connectionProvider();
      const coreApi = await connection.getTestResultsApi();
      const testResults = await coreApi.getTestResultDetailsForBuild(
        project,
        buildid
      );

      return {
        content: [{ type: "text", text: JSON.stringify(testResults, null, 2) }],
      };
    }
  );

}

/*
 * Helper function to convert steps text to XML format required
*/
function convertStepsToXml(steps: string): string {
  const stepsLines = steps.split("\n").filter((line) => line.trim() !== "");

  let xmlSteps = `<steps id="0" last="${stepsLines.length}">`;

  for (let i = 0; i < stepsLines.length; i++) {
    const stepLine = stepsLines[i].trim();
    if (stepLine) {
      const stepMatch = stepLine.match(/^(\d+)\.\s*(.+)$/);
      const stepText = stepMatch ? stepMatch[2] : stepLine;

      xmlSteps += `
                <step id="${i + 1}" type="ActionStep">
                    <parameterizedString isformatted="true">${escapeXml(
                      stepText
                    )}</parameterizedString>
                    <parameterizedString isformatted="true">Verify step completes successfully</parameterizedString>
                </step>`;
    }
  }

  xmlSteps += "</steps>";
  return xmlSteps;
}

/*
 * Helper function to escape XML special characters
*/
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

export { Test_Plan_Tools, configureTestPlanTools };
