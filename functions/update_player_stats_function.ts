import { DefineFunction, Schema, SlackFunction } from 'deno-slack-sdk/mod.ts'
import { EloChangeType } from './compute_elo_change_function.ts'
import PlayersDatastore from '../datastores/players_datastore.ts'

/**
 * A function definition to update player stats
 * https://api.slack.com/automation/functions/custom
 */
export const UpdatePlayerStatsFunctionDefinition = DefineFunction({
  callback_id: 'update_player_stats',
  title: 'Updates the player stats',
  description: 'Updates players stats after a match.',
  source_file: 'functions/update_player_stats_function.ts',
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
      elo_changes: {
        type: Schema.types.array,
        items: {
          type: EloChangeType,
        },
      },
    },
    required: ['team_1', 'team_2', 'team_1_score', 'team_2_score', 'winner', 'elo_changes'],
  },
})

/**
 * A function implementation to update player stats
 * https://api.slack.com/automation/functions/custom
 */
export default SlackFunction(
  UpdatePlayerStatsFunctionDefinition,
  async ({ inputs, client }) => {
    const bulkGetPlayerStats = await client.apps.datastore.bulkGet<typeof PlayersDatastore.definition>({
      datastore: PlayersDatastore.name,
      ids: inputs.elo_changes.map(eloChange => eloChange.playerId),
    })

    if (!bulkGetPlayerStats.ok) {
      return {
        error: `Failed to get player stats: ${bulkGetPlayerStats.error}`,
      }
    }

    const bulkUpdatePlayerStats = await client.apps.datastore.bulkPut<typeof PlayersDatastore.definition>({
      datastore: PlayersDatastore.name,
      items: bulkGetPlayerStats.items.map(currentPlayerStats => ({
        ...currentPlayerStats,
        elo: currentPlayerStats.elo + inputs.elo_changes.find(eloChange => eloChange.playerId === currentPlayerStats.id),
        nb_games: currentPlayerStats.nb_games + 1,
      })),
    })

    if (!bulkUpdatePlayerStats.ok) {
      return {
        error: `Failed to update player stats: ${bulkUpdatePlayerStats.error}`,
      }
    }

    return {
      outputs: {},
    }
  },
)
