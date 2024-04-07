import { Manifest } from "deno-slack-sdk/mod.ts";
import PlayersDatastore from './datastores/PlayersDatastore.ts'
import MatchHistoryDatastore from './datastores/MatchHistoryDatastore.ts'
import RecordGameResultWorkflow from './workflows/RecordGameResultWorkflow.ts'

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
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
  ],
});
