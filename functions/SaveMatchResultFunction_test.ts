import { SlackFunctionTester } from "deno-slack-sdk/mod.ts";
import { assertEquals, assertExists, assertStringIncludes } from "std/assert/mod.ts";
import * as mf from "mock-fetch/mod.ts";
import SaveMatchResultFunction from './SaveMatchResultFunction.ts'

const { createContext } = SlackFunctionTester("sample_function");

mf.install();

mf.mock("POST@/api/apps.datastore.put", async (args) => {
  const body = await args.formData();
  const datastore = body.get("datastore");
  const item = body.get("item");

  return new Response(
    `{"ok": true, "datastore": "${datastore}", "item": ${item}}`,
    {
      status: 200,
    },
  );
});

Deno.test("SaveMatchResultFunction should succeed when saving to the datastore succeeds", async () => {
  // Arrange
  const context = createContext({
    inputs: {
      team_1: ["1.1", "1.2"],
      team_2: ["2.1", "2.2"],
      team_1_score: 1,
      team_2_score: 2,
      winner: "team_2",
    },
  });

  // Act
  const result = await SaveMatchResultFunction(context);

  // Assert
  assertEquals(result.error, undefined);
  assertEquals(result.outputs, {});
});

Deno.test("SaveMatchResultFunction should fail when saving to the datastore fails", async () => {
  // Arrange
  mf.mock("POST@/api/apps.datastore.put", () => {
    return new Response(`{"ok": false, "error": "datastore_error"}`, {
      status: 200,
    });
  });

  const context = createContext({
    inputs: {
      team_1: ["1.1", "1.2"],
      team_2: ["2.1", "2.2"],
      team_1_score: 1,
      team_2_score: 2,
      winner: "team_2",
    },
  });

  // Act
  const result = await SaveMatchResultFunction(context);

  // Assert
  assertExists(result.error);
  assertStringIncludes(result.error, "datastore_error");
  assertEquals(result.outputs, undefined);
});
