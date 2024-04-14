import { DefineFunction, Schema, SlackFunction } from 'deno-slack-sdk/mod.ts'
import MatchHistoryDatastore, { Match } from '../datastores/match_history_datastore.ts'
import PlayersDatastore from '../datastores/players_datastore.ts'

/**
 * A function definition to view the match history
 * https://api.slack.com/automation/functions/custom
 */
export const GenerateMatchHistoryFunctionDefinition = DefineFunction({
  callback_id: 'generate_match_history',
  title: 'Generate the match history',
  description: 'Generate the match history',
  source_file: 'functions/generate_match_history_function.ts',
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
      match_history: {
        type: Schema.types.string,
      },
    },
    required: ['match_history'],
  },
})

export default SlackFunction(
  GenerateMatchHistoryFunctionDefinition,
  async ({ inputs, client }) => {
    const allPlayersStats = await client.apps.datastore.query<typeof PlayersDatastore.definition>({
      datastore: PlayersDatastore.name,
    })

    if (!allPlayersStats.ok) {
      return {
        error: `Failed to get player stats: ${allPlayersStats.error}`,
      }
    }

    const matchHistory = await client.apps.datastore.query<typeof MatchHistoryDatastore.definition>({
      datastore: MatchHistoryDatastore.name,
    })

    if (!matchHistory.ok) {
      return {
        error: `Failed to get match history stats: ${matchHistory.error}`,
      }
    }

    let playerNameChars = 0
    const playerNames = new Map<string, string>()
    for (const playerStats of allPlayersStats.items) {
      playerNames.set(playerStats.id, playerStats.name)
      playerNameChars = Math.max(playerNameChars, playerStats.name.length)
    }

    const matchFormatter = createMatchFormatter({
      playerNameChars: playerNameChars + 2, // +2 adjusted empirically
      playerNames,
    })

    const formattedMatches = matchHistory.items
      .toSorted(sortByReportedDate)
      .slice(0, 10)
      .map(matchFormatter)

    const lines = [
      bold('Ping pong match history (last 10 matches)'),
      '',
      codeBlock(formattedMatches.join('\n\n')),
    ]

    return {
      outputs: {
        match_history: lines.join('\n'),
      },
    }
  },
)

/**
 * Generates slack bold text
 * @param message The message to turn into bold text
 */
function bold(message: string): string {
  return '*' + message + '*'
}

/**
 * Generates a slack code block
 * @param message The message to turn into a code block
 */
function codeBlock(message: string): string {
  return '```' + message + '```'
}

/**
 * Creates a match formatter.
 */
function createMatchFormatter({ playerNameChars, playerNames }: {
  playerNameChars: number,
  playerNames: Map<string, string>
}) {
  return function (match: Match, index: number) {
    const dateString = new Date(Date.parse(match.report_date))
      .toLocaleDateString('en-us', {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })

    const team1WinnerString = match.winner === 'Team 1' ? ' (winner)' : ''
    const team1String = `Team 1 - ${match.team_1_score} pts${team1WinnerString}`

    const team2WinnerString = match.winner === 'Team 2' ? ' (winner)' : ''
    const team2String = `Team 2 - ${match.team_2_score} pts${team2WinnerString}`

    const lines = [
      `> ${index + 1}. ${dateString}`,
      `| ${team1String.padEnd(playerNameChars)} | ${team2String.padStart(playerNameChars)} |`,
      `| ${''.padEnd(playerNameChars, '-')} | ${''.padStart(playerNameChars, '-')} |`,
    ]

    for (let i = 0; i < Math.max(match.team_1.length, match.team_2.length); i++) {
      const team1PlayerName = playerNames.get(match.team_1[i]) ?? match.team_1[i] ?? ''
      const team2PlayerName = playerNames.get(match.team_2[i]) ?? match.team_2[i] ?? ''

      lines.push(`| ${team1PlayerName.padEnd(playerNameChars)} | ${team2PlayerName.padStart(playerNameChars)} |`)
    }

    return lines.join('\n')
  }
}

/**
 * Sorts the matches by most recently reported first.
 *
 * It should return a number where:
 * - A negative value indicates that a should come before b.
 * - A positive value indicates that a should come after b.
 * - Zero or NaN indicates that a and b are considered equal.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#comparefn
 */
function sortByReportedDate(match1: Match, match2: Match) {
  if (match1.report_date > match2.report_date) {
    return -1
  }

  if (match1.report_date < match2.report_date) {
    return 1
  }

  return 0
}
