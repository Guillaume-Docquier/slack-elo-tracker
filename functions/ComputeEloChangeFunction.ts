import { DefineFunction, Schema, SlackFunction, DefineProperty } from "deno-slack-sdk/mod.ts";

/**
 * A function definition to compute the change in ELO
 * https://api.slack.com/automation/functions/custom
 */
export const ComputeEloChangeFunctionDefinition = DefineFunction({
  callback_id: "compute_elo_change",
  title: "Compute elo change",
  description: "Computes the elo changes of players after a match.",
  source_file: "functions/ComputeEloChangeFunction.ts",
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
        enum: ["team_1", "team_2"],
      },
    },
    required: ["team_1", "team_2", "team_1_score", "team_2_score", "winner"],
  },
  output_parameters: {
    properties: {
      elo_changes: {
        type: Schema.types.array,
        items: DefineProperty({
          type: Schema.types.object,
          properties: {
            playerId: {
              type: Schema.slack.types.user_id,
            },
            elo_change: {
              type: Schema.types.number,
            },
          },
        }),
        description: "The players elo change",
      },
    },
    required: ["elo_changes"],
  },
});

/**
 * A function implementation to compute the change in ELO
 * https://api.slack.com/automation/functions/custom
 */
export default SlackFunction(
  ComputeEloChangeFunctionDefinition,
  async ({ inputs, client }) => {
    const winningTeam = inputs.winner === 'team_1' ? inputs.team_1 : inputs.team_2;

    // TODO Manfred code here
    return {
      outputs: {
        elo_changes: [],
      },
    };
  },
);
