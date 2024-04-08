import { DefineFunction, Schema, SlackFunction } from 'deno-slack-sdk/mod.ts'
import MatchHistoryDatastore from '../datastores/match_history_datastore.ts'

/**
 * A function definition to save a match result
 * https://api.slack.com/automation/functions/custom
 */
export const SaveMatchResultFunctionDefinition = DefineFunction({
  callback_id: 'save_match_result',
  title: 'Save a match result',
  description: 'Saves a match result in the datastore.',
  source_file: 'functions/save_match_result_function.ts',
  input_parameters: {
    properties: {
      team_1: {
        type: Schema.types.array,
        items: {
          type: Schema.slack.types.user_id,
        },
      },
      team_2: {
        type: Schema.types.array,
        items: {
          type: Schema.slack.types.user_id,
        },
      },
      team_1_score: {
        type: Schema.types.integer,
      },
      team_2_score: {
        type: Schema.types.integer,
      },
      winner: {
        type: Schema.types.string,
        enum: ['team_1', 'team_2'],
      },
    },
    required: ['team_1', 'team_2', 'team_1_score', 'team_2_score', 'winner'],
  },
})

/**
 * A function implementation to save a match result
 * https://api.slack.com/automation/functions/custom
 */
export default SlackFunction(
  SaveMatchResultFunctionDefinition,
  async ({ inputs, client }) => {
    const putResponse = await client.apps.datastore.put<typeof MatchHistoryDatastore.definition>({
      datastore: 'MatchHistory',
      item: {
        id: crypto.randomUUID(),
        report_date: new Date(),
        team_1: inputs.team_1,
        team_2: inputs.team_2,
        team_1_score: inputs.team_1_score,
        team_2_score: inputs.team_2_score,
        winner: inputs.winner,
      },
    })

    if (!putResponse.ok) {
      return {
        error: `Failed to put item into the datastore: ${putResponse.error}`,
      }
    }

    return {
      outputs: {},
    }
  },
)
