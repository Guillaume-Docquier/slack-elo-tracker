import { SlackFunctionTester } from 'deno-slack-sdk/mod.ts'
import { assertEquals, assertExists, assertStringIncludes } from 'std/assert/mod.ts'
import * as mf from 'mock-fetch/mod.ts'
import ComputeEloChangeFunction from './compute_elo_change_function.ts'
import type { PlayerStats } from '../datastores/players_datastore.ts'

const { createContext } = SlackFunctionTester('compute_elo_change')

mf.install()

Deno.test('ComputeEloChangeFunction should grant and take 49 elo when all players have equal elo and 10 games played', async () => {
  // Arrange
  const allPlayersStats = [
    { id: '1.1', name: '1.1', elo: 1400, nb_games: 10 },
    { id: '1.2', name: '1.2', elo: 1400, nb_games: 10 },
    { id: '2.1', name: '2.1', elo: 1400, nb_games: 10 },
    { id: '2.2', name: '2.2', elo: 1400, nb_games: 10 },
  ]

  const expectedEloChanges = [
    { player_id: '1.1', elo_change: 49 },
    { player_id: '1.2', elo_change: 49 },
    { player_id: '2.1', elo_change: -49 },
    { player_id: '2.2', elo_change: -49 },
  ]

  // Act & Assert
  await testElo(allPlayersStats, expectedEloChanges)
})

Deno.test('ComputeEloChangeFunction should grant and take 0 elo when the elo gap is too large elo and 10 games played', async () => {
  // Arrange
  const allPlayersStats = [
    { id: '1.1', name: '1.1', elo: 3000, nb_games: 10 },
    { id: '1.2', name: '1.2', elo: 3000, nb_games: 10 },
    { id: '2.1', name: '2.1', elo: 1000, nb_games: 10 },
    { id: '2.2', name: '2.2', elo: 1000, nb_games: 10 },
  ]

  const expectedEloChanges = [
    { player_id: '1.1', elo_change: 0 },
    { player_id: '1.2', elo_change: 0 },
    { player_id: '2.1', elo_change: 0 },
    { player_id: '2.2', elo_change: 0 },
  ]

  // Act & Assert
  await testElo(allPlayersStats, expectedEloChanges)
})

Deno.test('ComputeEloChangeFunction should grant more elo to the weaker player in the winning team', async () => {
  // Arrange
  const allPlayersStats = [
    { id: '1.1', name: '1.1', elo: 3000, nb_games: 10 },
    { id: '1.2', name: '1.2', elo: 1000, nb_games: 10 },
    { id: '2.1', name: '2.1', elo: 2000, nb_games: 10 },
    { id: '2.2', name: '2.2', elo: 2000, nb_games: 10 },
  ]

  const expectedEloChanges = [
    { player_id: '1.1', elo_change: 25 },
    { player_id: '1.2', elo_change: 73 },
    { player_id: '2.1', elo_change: -49 },
    { player_id: '2.2', elo_change: -49 },
  ]

  // Act & Assert
  await testElo(allPlayersStats, expectedEloChanges)
})

Deno.test('ComputeEloChangeFunction should take more elo from the stronger player in the losing team', async () => {
  // Arrange
  const allPlayersStats = [
    { id: '1.1', name: '1.1', elo: 2000, nb_games: 10 },
    { id: '1.2', name: '1.2', elo: 2000, nb_games: 10 },
    { id: '2.1', name: '2.1', elo: 3000, nb_games: 10 },
    { id: '2.2', name: '2.2', elo: 1000, nb_games: 10 },
  ]

  const expectedEloChanges = [
    { player_id: '1.1', elo_change: 49 },
    { player_id: '1.2', elo_change: 49 },
    { player_id: '2.1', elo_change: -73 },
    { player_id: '2.2', elo_change: -25 },
  ]

  // Act & Assert
  await testElo(allPlayersStats, expectedEloChanges)
})

Deno.test('ComputeEloChangeFunction should compute expected elo changes', async () => {
  // Arrange
  const allPlayersStats = [
    { id: '1.1', name: '1.1', elo: 1500, nb_games: 10 },
    { id: '1.2', name: '1.2', elo: 1300, nb_games: 10 },
    { id: '2.1', name: '2.1', elo: 1400, nb_games: 10 },
    { id: '2.2', name: '2.2', elo: 1200, nb_games: 10 },
  ]

  const expectedEloChanges = [
    { player_id: '1.1', elo_change: 34 },
    { player_id: '1.2', elo_change: 44 },
    { player_id: '2.1', elo_change: -44 },
    { player_id: '2.2', elo_change: -34 },
  ]

  // Act & Assert
  await testElo(allPlayersStats, expectedEloChanges)
})

Deno.test('ComputeEloChangeFunction should fail when fetching the datastore fails', async () => {
  // Arrange
  mf.mock('POST@/api/apps.datastore.bulkGet', () => {
    return new Response(
      JSON.stringify({ ok: false, error: 'datastore_error' }),
      { status: 200 },
    )
  })

  const context = createContext({
    inputs: {
      team_1: ['1.1', '1.2'],
      team_2: ['2.1', '2.2'],
      team_1_score: 2,
      team_2_score: 1,
      winner: 'My team',
      elo_changes: [
        { player_id: '1.1', elo_change: 5 },
        { player_id: '1.2', elo_change: 10 },
        { player_id: '2.1', elo_change: -7 },
        { player_id: '2.2', elo_change: -7 },
      ],
    },
  })

  // Act
  const result = await ComputeEloChangeFunction(context)

  // Assert
  assertExists(result.error)
  assertStringIncludes(result.error, 'datastore_error')
  assertEquals(result.outputs, undefined)
})

function mockPlayerStats(allPlayersStats: PlayerStats[]) {
  mf.mock('POST@/api/apps.datastore.bulkGet', async (args) => {
    const body = await args.formData()
    const datastore = body.get('datastore')

    return new Response(
      JSON.stringify({ ok: true, datastore, items: allPlayersStats }),
      { status: 200 },
    )
  })
}

async function testElo(allPlayersStats: PlayerStats[], expectedEloChanges: unknown[]) {
  // Arrange
  mockPlayerStats(allPlayersStats)

  const context = createContext({
    inputs: {
      team_1: ['1.1', '1.2'],
      team_2: ['2.1', '2.2'],
      team_1_score: 2,
      team_2_score: 1,
      winner: 'My team',
    },
  })

  // Act
  const result = await ComputeEloChangeFunction(context)

  // Assert
  assertEquals(result.error, undefined)
  assertEquals(result.outputs?.elo_changes, expectedEloChanges)
}
