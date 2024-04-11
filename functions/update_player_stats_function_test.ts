import { SlackFunctionTester } from 'deno-slack-sdk/mod.ts'
import { assertEquals, assertExists, assertStringIncludes } from 'std/assert/mod.ts'
import * as mf from 'mock-fetch/mod.ts'
import UpdatePlayerStatsFunction from './update_player_stats_function.ts'

const { createContext } = SlackFunctionTester('update_player_stats')

mf.install()

mf.mock('POST@/api/apps.datastore.bulkGet', async (args) => {
  const body = await args.formData()
  const datastore = body.get('datastore')
  const items = [
    { id: '1.1', name: '1.1', elo: 1400, nb_games: 10 },
    { id: '1.2', name: '1.2', elo: 1400, nb_games: 10 },
    { id: '2.1', name: '2.1', elo: 1400, nb_games: 10 },
    { id: '2.2', name: '2.2', elo: 1400, nb_games: 10 },
  ]

  return new Response(
    JSON.stringify({ ok: true, datastore, items }),
    { status: 200 },
  )
})

mf.mock('POST@/api/apps.datastore.bulkPut', async (args) => {
  const body = await args.formData()
  const datastore = body.get('datastore')
  const items = body.get('items')

  return new Response(
    JSON.stringify({ ok: true, datastore, items }),
    { status: 200 },
  )
})

Deno.test('UpdatePlayerStatsFunction should succeed when fetching and updating to the datastore succeeds', async () => {
  // Arrange
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
  const result = await UpdatePlayerStatsFunction(context)

  // Assert
  assertEquals(result.error, undefined)
  assertEquals(result.outputs, {})
})

Deno.test('UpdatePlayerStatsFunction should fail when fetching the datastore fails', async () => {
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
  const result = await UpdatePlayerStatsFunction(context)

  // Assert
  assertExists(result.error)
  assertStringIncludes(result.error, 'datastore_error')
  assertEquals(result.outputs, undefined)
})

Deno.test('UpdatePlayerStatsFunction should fail when updating the datastore fails', async () => {
  // Arrange
  mf.mock('POST@/api/apps.datastore.bulkPut', () => {
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
  const result = await UpdatePlayerStatsFunction(context)

  // Assert
  assertExists(result.error)
  assertStringIncludes(result.error, 'datastore_error')
  assertEquals(result.outputs, undefined)
})
