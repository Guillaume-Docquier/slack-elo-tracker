import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

/**
 * A datastore to store the history of matches
 * https://api.slack.com/automation/datastores
 */
const MatchHistoryDatastore = DefineDatastore({
  name: "MatchHistory",
  primary_key: "id",
  attributes: {
    id: {
      type: Schema.types.string,
    },
    report_date: {
      type: Schema.slack.types.date,
    },
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
    // TODO GD Do we really need the winner
    winner: {
      type: Schema.types.string,
    },
  },
});

export default MatchHistoryDatastore;
