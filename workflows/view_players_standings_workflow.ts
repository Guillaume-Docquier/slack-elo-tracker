import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { GeneratePlayersStandingsFunctionDefinition } from "../functions/generate_players_standings_function.ts";

/**
 * A workflow to view players standings.
 *
 * https://api.slack.com/automation/workflows
 * https://api.slack.com/automation/forms#add-interactivity
 */
const ViewPlayersStandingsWorkflow = DefineWorkflow({
  callback_id: 'players_standings_workflow',
  title: 'View players standings',
  description: 'View the standings of all players',
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      requester: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ['interactivity', 'requester'],
  },
})

const generatePlayersStandingsStep = ViewPlayersStandingsWorkflow.addStep(GeneratePlayersStandingsFunctionDefinition, {
  requester: ViewPlayersStandingsWorkflow.inputs.requester,
})

ViewPlayersStandingsWorkflow.addStep(Schema.slack.functions.SendDm, {
  user_id: ViewPlayersStandingsWorkflow.inputs.requester,
  message: generatePlayersStandingsStep.outputs.standings,
})

export default ViewPlayersStandingsWorkflow
