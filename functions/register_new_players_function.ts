import { DefineFunction, Schema, SlackFunction } from 'deno-slack-sdk/mod.ts'
import PlayersDatastore from '../datastores/players_datastore.ts'

/**
 * A function definition to add new players to the database
 * https://api.slack.com/automation/functions/custom
 */
export const RegisterNewPlayersFunctionDefinition = DefineFunction({
  callback_id: 'register_new_players',
  title: 'Add new players',
  description: 'Adds new players to the database.',
  source_file: 'functions/register_new_players_function.ts',
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
    },
    required: ['team_1', 'team_2'],
  },
})

/**
 * A function implementation to add new players to the database
 * https://api.slack.com/automation/functions/custom
 */
export default SlackFunction(
  RegisterNewPlayersFunctionDefinition,
  async ({ inputs, client }) => {
    const playerIds = inputs.team_1.concat(inputs.team_2)
    const bulkGetPlayerStats = await client.apps.datastore.bulkGet<typeof PlayersDatastore.definition>({
      datastore: PlayersDatastore.name,
      ids: playerIds,
    })

    if (!bulkGetPlayerStats.ok) {
      return {
        error: `Failed to get player stats: ${bulkGetPlayerStats.error}`,
      }
    }

    const existingPlayers = bulkGetPlayerStats.items.map(playerStats => playerStats.id)
    const playerIdsToAdd = playerIds.filter(playerId => !existingPlayers.includes(playerId))
    if (playerIdsToAdd.length === 0) {
      return {
        outputs: {},
      }
    }

    const newPlayers = playerIdsToAdd.map(playerId => ({
      id: playerId,
      // TODO Fetch the user name, requires additional permissions
      // https://api.slack.com/methods/users.profile.get
      // https://api.slack.com/methods/users.info
      // await client.users.info({ user: userId }).user.real_name
      name: 'fakeName',
      elo: 1400,
      nb_games: 0,
    }))

    const bulkUpdatePlayerStats = await client.apps.datastore.bulkPut<typeof PlayersDatastore.definition>({
      datastore: PlayersDatastore.name,
      items: newPlayers,
    })

    if (!bulkUpdatePlayerStats.ok) {
      return {
        error: `Failed to update player stats: ${bulkUpdatePlayerStats.error}`,
      }
    }

    console.log(`Successfully added new players:\n${JSON.stringify(newPlayers, null, 2)}`)

    return {
      outputs: {},
    }
  },
)
