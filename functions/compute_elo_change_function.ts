import { DefineFunction, Schema, SlackFunction, DefineType } from 'deno-slack-sdk/mod.ts'
import PlayersDatastore, { PlayerStats } from '../datastores/players_datastore.ts'

/**
 * A schema representing an elo change
 */
export const EloChangeType = DefineType({
  name: 'EloChange',
  type: Schema.types.object,
  properties: {
    player_id: {
      type: Schema.slack.types.user_id,
    },
    elo_change: {
      type: Schema.types.number,
    },
  },
  required: ['player_id', 'elo_change'],
})

/**
 * A function definition to compute the change in ELO
 * https://api.slack.com/automation/functions/custom
 */
export const ComputeEloChangeFunctionDefinition = DefineFunction({
  callback_id: 'compute_elo_change',
  title: 'Compute elo change',
  description: 'Computes the elo changes of players after a match.',
  source_file: 'functions/compute_elo_change_function.ts',
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
    },
    required: ['team_1', 'team_2', 'team_1_score', 'team_2_score', 'winner'],
  },
  output_parameters: {
    properties: {
      elo_changes: {
        type: Schema.types.array,
        items: {
          type: EloChangeType,
        },
        description: 'The players elo change',
      },
    },
    required: ['elo_changes'],
  },
})

/**
 * A function implementation to compute the change in ELO
 * https://api.slack.com/automation/functions/custom
 */
export default SlackFunction(
  ComputeEloChangeFunctionDefinition,
  async ({ inputs, client }) => {
    const bulkGetPlayerStats = await client.apps.datastore.bulkGet<typeof PlayersDatastore.definition>({
      datastore: PlayersDatastore.name,
      ids: inputs.team_1.concat(inputs.team_2),
    })

    if (!bulkGetPlayerStats.ok) {
      return {
        error: `Failed to get player stats: ${bulkGetPlayerStats.error}`,
      }
    }

    const winningTeam = inputs.winner === 'My team' ? inputs.team_1 : inputs.team_2
    const playerTeams = buildPlayerTeams(bulkGetPlayerStats.items, inputs.team_1, inputs.team_2)
    const playerWinProbabilities = buildPlayerWinProbabilities(bulkGetPlayerStats.items, playerTeams, inputs.team_1, inputs.team_2)

    return {
      outputs: {
        elo_changes: bulkGetPlayerStats.items
          .map(playerStats => {
            const yourTeam = playerTeams.get(playerStats.id)!

            const didWin = yourTeam === winningTeam

            const k = computeK(playerStats.nb_games)

            const yourScore = yourTeam === inputs.team_1 ? inputs.team_1_score : inputs.team_2_score
            const theirScore = yourTeam === inputs.team_1 ? inputs.team_2_score : inputs.team_1_score
            const pointFactor = computeScoreFactor({ yourScore, theirScore })

            const teamWinProbability = yourTeam
              .map(teamMemberId => playerWinProbabilities.get(teamMemberId)! / yourTeam.length)
              .reduce((sum, value) => sum + value)

            const playerWinProbability = playerWinProbabilities.get(playerStats.id)!

            const eloChange = computeEloChange({
              k,
              pointFactor,
              didWin,
              teamWinProbability,
              playerWinProbability,
            })

            return {
              player_id: playerStats.id,
              elo_change: eloChange,
            }
          }),
      },
    }
  },
)

/**
 * Builds a mapping from a player id to its team.
 *
 * @param allPlayersStats - All the players stats
 * @param team1 - The ids of the members of team 1
 * @param team2 - The ids of the members of team 2
 */
function buildPlayerTeams(allPlayersStats: PlayerStats[], team1: string[], team2: string[]): Map<string, string[]> {
  const playerTeams = new Map<string, string[]>()
  for (const playerStats of allPlayersStats) {
    const team = team1.includes(playerStats.id)
      ? team1
      : team2

    playerTeams.set(playerStats.id, team)
  }

  return playerTeams
}

/**
 * Builds a mapping from a player id to its expected win probability.
 *
 * @param allPlayersStats - All the players stats
 * @param playerTeams - The mapping from a player id to its team
 * @param team1 - The ids of the members of team 1
 * @param team2 - The ids of the members of team 2
 */
function buildPlayerWinProbabilities(allPlayersStats: PlayerStats[], playerTeams: Map<string, string[]>, team1: string[], team2: string[]): Map<string, number> {
  const playerWinProbabilities = new Map<string, number>()
  for (const playerStats of allPlayersStats) {
    const yourTeam = playerTeams.get(playerStats.id)!
    const theirTeam = yourTeam === team1 ? team2 : team1
    const opponents = allPlayersStats.filter(playerStats => theirTeam.includes(playerStats.id))

    playerWinProbabilities.set(playerStats.id, computeExpectedPlayerWinProbability(playerStats, opponents))
  }

  return playerWinProbabilities
}

/**
 * Computes the expected player win probability based on their elo and their opponent elos
 * @param player - The player
 * @param opponents - The opponents
 */
function computeExpectedPlayerWinProbability(player: PlayerStats, opponents: PlayerStats[]): number {
  return opponents
    .map(opponent => 1 / (1 + Math.pow(10, (opponent.elo - player.elo) / 500)))
    .reduce((sum, value) => sum + value / opponents.length, 0)
}

interface ComputePointFactorParameters {
  yourScore: number
  theirScore: number
}

/**
 * Computes the elo score factor based on each team's scores.
 * The more points you score compared to your opponent, the more elo you'll gain.
 */
function computeScoreFactor({ yourScore, theirScore }: ComputePointFactorParameters): number {
  return 2 + (Math.log10(Math.abs(yourScore - theirScore) + 1)) ** 3
}

/**
 * Computes the elo K factor based on the number of games played.
 * The more you play games, the smaller K gets, stabilizing your elo.
 *
 * @param numberOfGamesPlayed - The number of games played by a player.
 */
function computeK(numberOfGamesPlayed: number): number {
  return 50 / (1 + (numberOfGamesPlayed / 300))
}

interface EloChangeParameters {
  k: number
  pointFactor: number
  didWin: boolean
  teamWinProbability: number
  playerWinProbability: number
}

/**
 * Computes the change in elo based on several parameters
 * @param k - The K factor is a factor that stabilizes elo changes over time.
 * @param pointFactor - The point factor grants more elo for wins with large points difference.
 * @param didWin - Whether the game was won.
 * @param teamWinProbability - The probability that the team should have won
 * @param playerWinProbability - The probability that the player should have won
 */
function computeEloChange({
                            k,
                            pointFactor,
                            didWin,
                            teamWinProbability,
                            playerWinProbability,
                          }: EloChangeParameters): number {
  const gameActualResult = didWin ? 1 : 0
  const expectedWinProbability = (teamWinProbability + playerWinProbability) / 2

  return Math.round(k * pointFactor * (gameActualResult - expectedWinProbability))
}
