import { Manifest } from 'deno-slack-sdk/mod.ts'
import PlayersDatastore from './datastores/players_datastore.ts'
import MatchHistoryDatastore from './datastores/match_history_datastore.ts'
import RecordGameResultWorkflow from './workflows/record_game_result_workflow.ts'
import ViewPlayersStandingsWorkflow from './workflows/view_players_standings_workflow.ts'
import { EloChangeType } from './functions/compute_elo_change_function.ts'
import ViewMatchHistoryWorkflow from './workflows/view_match_history_workflow.ts'

/**
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: 'Ping pong bot',
  description: 'A bot to track ping pong elo',
  icon: 'assets/elo_rating_app_logo.png',
  workflows: [
    RecordGameResultWorkflow,
    ViewPlayersStandingsWorkflow,
    ViewMatchHistoryWorkflow,
  ],
  outgoingDomains: [],
  datastores: [
    PlayersDatastore,
    MatchHistoryDatastore,
  ],
  types: [
    EloChangeType,
  ],
  botScopes: [
    'commands',
    'chat:write',
    'chat:write.public',
    'datastore:read',
    'datastore:write',
    'users:read',
  ],
})
