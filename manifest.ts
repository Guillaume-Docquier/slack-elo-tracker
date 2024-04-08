import { Manifest } from "deno-slack-sdk/mod.ts";
import PlayersDatastore from './datastores/players_datastore.ts'
import MatchHistoryDatastore from './datastores/match_history_datastore.ts'
import RecordGameResultWorkflow from './workflows/record_game_result_workflow.ts'
import { EloChangeType } from './functions/compute_elo_change_function.ts'

/**
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "Elo tracker",
  description: "A slack app to track players elo",
  icon: "assets/default_new_app_icon.png",
  workflows: [
    RecordGameResultWorkflow,
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
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
  ],
});
