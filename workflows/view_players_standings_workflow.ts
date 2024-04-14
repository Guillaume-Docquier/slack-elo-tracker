import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { ViewPlayersStandingsFunctionDefinition } from "../functions/view_players_standings_function.ts";

/**
 * A workflow to record the result of a game.
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

ViewPlayersStandingsWorkflow.addStep(ViewPlayersStandingsFunctionDefinition, {
  requester: ViewPlayersStandingsWorkflow.inputs.requester,
})

export default ViewPlayersStandingsWorkflow
