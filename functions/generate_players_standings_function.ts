import { DefineFunction, Schema, SlackFunction } from 'deno-slack-sdk/mod.ts';
import PlayersDatastore, { PlayerStats } from '../datastores/players_datastore.ts'

/**
 * A function definition to view player standings
 * https://api.slack.com/automation/functions/custom
 */
export const GeneratePlayersStandingsFunctionDefinition = DefineFunction({
  callback_id: 'view_players_standings',
  title: 'View the players standings',
  description: 'View the players standings',
  source_file: 'functions/generate_players_standings_function.ts',
  input_parameters: {
    properties: {
      requester: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ['requester'],
  },
  output_parameters: {
    properties: {
      standings: {
        type: Schema.types.string,
      },
    },
    required: ['standings'],
  },
})

export default SlackFunction(
  GeneratePlayersStandingsFunctionDefinition,
  async ({ inputs, client }) => {
    const allPlayersStats = await client.apps.datastore.query<typeof PlayersDatastore.definition>({
      datastore: PlayersDatastore.name,
    })

    if (!allPlayersStats.ok) {
      return {
        error: `Failed to get player stats: ${allPlayersStats.error}`,
      }
    }

    const maxNameLength = Math.max(0, ...allPlayersStats.items.map(playerStats => playerStats.name.length))
    const orderedPlayers = allPlayersStats.items.toSorted(sortByEloDescending)

    const lineFormatter = createTableRowFormatter({
      rankChars: "Rank".length,
      nameChars: maxNameLength,
      eloChars: 4, // Probably max 9999 elo
      gamesChars: "Games played".length,
    })

    const lines = [
      lineFormatter({
        rank: "Rank",
        name: "Name",
        elo: "Elo",
        games: "Games played",
      }),
      lineFormatter({
        rank: "",
        name: "",
        elo: "",
        games: "",
        fillChar: '-',
      }),
      ...orderedPlayers.map((player, index) => lineFormatter({
        rank: (index + 1).toString(),
        name: player.name,
        elo: player.elo.toString(),
        games: player.nb_games.toString(),
        isRequester: player.id === inputs.requester,
      })),
    ]

    await client.chat.postMessage({
      channel: inputs.requester,
      text: codeBlock(lines.join('\n')),
    })

    return {
      outputs: {
        standings: codeBlock(lines.join('\n')),
      },
    }
  },
)

/**
 * Sorts the players by highest elo first.
 *
 * It should return a number where:
 * - A negative value indicates that a should come before b.
 * - A positive value indicates that a should come after b.
 * - Zero or NaN indicates that a and b are considered equal.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#comparefn
 *
 * @param player1
 * @param player2
 */
function sortByEloDescending(player1: PlayerStats, player2: PlayerStats): -1 | 0 | 1 {
  if (player1.elo > player2.elo) {
    return -1;
  }

  if (player1.elo < player2.elo) {
    return 1;
  }

  return 0;
}

/**
 * Generates a slack code block
 * @param message The message to turn into a code block
 */
function codeBlock(message: string): string {
  return '```' + message + '```'
}

/**
 * Creates a table row formatter.
 * @param rankChars The number of characters for the rank column
 * @param nameChars The number of characters for the name column
 * @param eloChars The number of characters for the elo column
 * @param gamesChars The number of characters for the games column
 */
function createTableRowFormatter({ rankChars, nameChars, eloChars, gamesChars }: {
  rankChars: number,
  nameChars: number,
  eloChars: number,
  gamesChars: number
}) {
  return function ({ rank, name, elo, games, isRequester, fillChar }: {
    rank: string,
    name: string,
    elo: string,
    games: string,
    isRequester?: boolean
    fillChar?: string
  }) {
    const requesterStartMarker = createRequesterMarker(isRequester, 'start')
    const requesterEndMarker = createRequesterMarker(isRequester, 'end')

    return `| ${(requesterStartMarker + rank).padEnd(rankChars, fillChar)} | ${name.padEnd(nameChars, fillChar)} | ${elo.padEnd(eloChars, fillChar)} | ${(games + requesterEndMarker).padEnd(gamesChars, fillChar)} |`
  }
}

/**
 * Creates a marker to mark a row
 * @param isRequester Whether to mark the row. Undefined will return no marker, false will return an empty placeholder
 * @param position Whether this is a start or end marker
 */
function createRequesterMarker(isRequester: boolean | undefined, position: "start" | "end"): string {
  switch (isRequester) {
    case undefined:
      return ''
    case true:
      return position === "start"
        ? '> '
        : ' <'
    case false:
      return '  '
  }
}
