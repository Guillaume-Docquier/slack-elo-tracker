import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { ComputeEloChangeFunctionDefinition } from '../functions/ComputeEloChangeFunction.ts'
import { SaveMatchResultFunctionDefinition } from '../functions/SaveMatchResultFunction.ts'

/**
 * A workflow to record the result of a game.
 *
 * https://api.slack.com/automation/workflows
 * https://api.slack.com/automation/forms#add-interactivity
 */
const RecordGameResultWorkflow = DefineWorkflow({
  callback_id: "new_game_workflow",
  title: "Record game result",
  description: "Remember that you swore an oath to tell the truth, the whole truth, and nothing but the truth.",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      user: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ["interactivity", "user"],
  },
});

/**
 * A form to collect data about the game.
 * https://api.slack.com/automation/functions#open-a-form
 */
const gameResultForm = RecordGameResultWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Record game result",
    interactivity: RecordGameResultWorkflow.inputs.interactivity,
    submit_label: "Submit",
    fields: {
      elements: [
        {
          name: "Your team",
          title: "Select the players in your team",
          type: Schema.types.array,
          items: {
            type: Schema.slack.types.user_id,
          },
        },
        {
          name: "Your score",
          title: "Enter your team's score",
          type: Schema.types.integer,
        },
        {
          name: "Their team",
          title: "Select the players in their team",
          type: Schema.types.array,
          items: {
            type: Schema.slack.types.user_id,
          },
        },
        {
          name: "Their score",
          title: "Enter their team's score",
          type: Schema.types.integer,
        },
        {
          name: "Winner",
          title: "Who won?",
          type: Schema.types.string,
          enum: ["Your team", "Their team"],
        },
      ],
      required: ["Your team", "Your score", "Their team", "Their score", "Winner"],
    },
  },
);

// TODO Add a validation step

const computeEloChangesStep = RecordGameResultWorkflow.addStep(ComputeEloChangeFunctionDefinition, {
  team_1: gameResultForm.outputs.fields["Your team"],
  team_2: gameResultForm.outputs.fields["Their team"],
  team_1_score: gameResultForm.outputs.fields["Your score"],
  team_2_score: gameResultForm.outputs.fields["Their score"],
  winner: gameResultForm.outputs.fields["Winner"],
});

// TODO Save player stats to the datastore

RecordGameResultWorkflow.addStep(SaveMatchResultFunctionDefinition, {
  team_1: gameResultForm.outputs.fields["Your team"],
  team_2: gameResultForm.outputs.fields["Their team"],
  team_1_score: gameResultForm.outputs.fields["Your score"],
  team_2_score: gameResultForm.outputs.fields["Their score"],
  winner: gameResultForm.outputs.fields["Winner"],
});

RecordGameResultWorkflow.addStep(Schema.slack.functions.SendMessage, {
  channel_id: RecordGameResultWorkflow.inputs.user,
  message: '```' + JSON.stringify(computeEloChangesStep.outputs.elo_changes, null, 2) + '```',
});

export default RecordGameResultWorkflow;
