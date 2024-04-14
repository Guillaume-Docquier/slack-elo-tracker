import { DefineWorkflow, Schema } from 'deno-slack-sdk/mod.ts'
import { ComputeEloChangeFunctionDefinition } from '../functions/compute_elo_change_function.ts'
import { SaveMatchResultFunctionDefinition } from '../functions/save_match_result_function.ts'
import { UpdatePlayerStatsFunctionDefinition } from '../functions/update_player_stats_function.ts'
import { RegisterNewPlayersFunctionDefinition } from '../functions/register_new_players_function.ts'
import { ViewPlayersStandingsFunctionDefinition } from '../functions/view_players_standings_function.ts'

/**
 * A workflow to record the result of a game.
 *
 * https://api.slack.com/automation/workflows
 * https://api.slack.com/automation/forms#add-interactivity
 */
const RecordGameResultWorkflow = DefineWorkflow({
  callback_id: 'new_game_workflow',
  title: 'Record game result',
  description: 'Remember that you swore an oath to tell the truth, the whole truth, and nothing but the truth.',
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

/**
 * A form to collect data about the game.
 * https://api.slack.com/automation/functions#open-a-form
 */
const gameResultForm = RecordGameResultWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: 'Record game result',
    interactivity: RecordGameResultWorkflow.inputs.interactivity,
    submit_label: 'Submit',
    fields: {
      elements: [
        {
          name: 'your_team',
          title: 'Select the players in your team',
          type: Schema.types.array,
          items: {
            type: Schema.slack.types.user_id,
          },
        },
        {
          name: 'your_score',
          title: "Enter your team's score",
          type: Schema.types.integer,
        },
        {
          name: 'their_team',
          title: 'Select the players in their team',
          type: Schema.types.array,
          items: {
            type: Schema.slack.types.user_id,
          },
        },
        {
          name: 'their_score',
          title: "Enter their team's score",
          type: Schema.types.integer,
        },
        {
          name: 'winner',
          title: 'Who won?',
          type: Schema.types.string,
          enum: ['My team', 'Their team'],
        },
      ],
      required: ['your_team', 'your_score', 'their_team', 'their_score', 'winner'],
    },
  },
)

// TODO Add a validation step
// TODO GD Make sure multiple players reporting the same match does not cause multiple submissions

RecordGameResultWorkflow.addStep(RegisterNewPlayersFunctionDefinition, {
  team_1: gameResultForm.outputs.fields.your_team,
  team_2: gameResultForm.outputs.fields.their_team,
})

const computeEloChangesStep = RecordGameResultWorkflow.addStep(ComputeEloChangeFunctionDefinition, {
  team_1: gameResultForm.outputs.fields.your_team,
  team_2: gameResultForm.outputs.fields.their_team,
  team_1_score: gameResultForm.outputs.fields.your_score,
  team_2_score: gameResultForm.outputs.fields.their_score,
  winner: gameResultForm.outputs.fields.winner,
})

RecordGameResultWorkflow.addStep(UpdatePlayerStatsFunctionDefinition, {
  team_1: gameResultForm.outputs.fields.your_team,
  team_2: gameResultForm.outputs.fields.their_team,
  team_1_score: gameResultForm.outputs.fields.your_score,
  team_2_score: gameResultForm.outputs.fields.their_score,
  winner: gameResultForm.outputs.fields.winner,
  elo_changes: computeEloChangesStep.outputs.elo_changes,
})

RecordGameResultWorkflow.addStep(SaveMatchResultFunctionDefinition, {
  team_1: gameResultForm.outputs.fields.your_team,
  team_2: gameResultForm.outputs.fields.their_team,
  team_1_score: gameResultForm.outputs.fields.your_score,
  team_2_score: gameResultForm.outputs.fields.their_score,
  winner: gameResultForm.outputs.fields.winner,
})

RecordGameResultWorkflow.addStep(ViewPlayersStandingsFunctionDefinition, {
  requester: RecordGameResultWorkflow.inputs.requester,
})

export default RecordGameResultWorkflow
