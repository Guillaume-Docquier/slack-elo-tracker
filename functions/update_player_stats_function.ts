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
        enum: ['My team', 'Their team'],
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
    const playerIds = inputs.elo_changes.map(eloChange => eloChange.player_id)
    const bulkGetPlayerStats = await client.apps.datastore.bulkGet<typeof PlayersDatastore.definition>({
      datastore: PlayersDatastore.name,
      ids: playerIds,
    })

    if (!bulkGetPlayerStats.ok) {
      return {
        error: `Failed to get player stats: ${bulkGetPlayerStats.error}`,
      }
    }

    if (bulkGetPlayerStats.items.length !== playerIds.length) {
      return {
        error: `Failed to get all player stats. Got ${bulkGetPlayerStats.items.length} but expected ${playerIds.length}`,
      }
    }

    const updatedPlayerStats = await Promise.all(bulkGetPlayerStats.items.map(async currentPlayerStats => ({
      ...currentPlayerStats,
      name: (await client.users.info({ user: currentPlayerStats.id })).user.real_name, // Keep their name up to date, why not
      elo: currentPlayerStats.elo + inputs.elo_changes.find(eloChange => eloChange.player_id === currentPlayerStats.id)?.elo_change,
      nb_games: currentPlayerStats.nb_games + 1,
    })))

    const bulkUpdatePlayerStats = await client.apps.datastore.bulkPut<typeof PlayersDatastore.definition>({
      datastore: PlayersDatastore.name,
      items: updatedPlayerStats,
    })

    if (!bulkUpdatePlayerStats.ok) {
      return {
        error: `Failed to update player stats: ${bulkUpdatePlayerStats.error}`,
      }
    }

    console.log(`Successfully updated player stats:\n${JSON.stringify(updatedPlayerStats, null, 2)}`)

    return {
      outputs: {},
    }
  },
)
