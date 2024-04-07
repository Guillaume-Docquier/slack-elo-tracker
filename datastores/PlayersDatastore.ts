import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

/**
 * A datastore to store players stats such as name, id, number of wins/losses, current elo, etc.
 * https://api.slack.com/automation/datastores
 */
const PlayersDatastore = DefineDatastore({
  name: "Players",
  primary_key: "id",
  attributes: {
    id: {
      type: Schema.slack.types.user_id,
    },
    name: {
      type: Schema.types.string,
    },
    elo: {
      type: Schema.types.number,
    },
    nb_games: {
      type: Schema.types.integer,
    },
  },
});

export default PlayersDatastore;
