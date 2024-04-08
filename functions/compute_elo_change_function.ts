import { DefineFunction, Schema, SlackFunction, DefineProperty } from "deno-slack-sdk/mod.ts";

/**
 * A schema representing an elo change
 */
export const EloChangeProperty = DefineProperty({
  type: Schema.types.object,
  properties: {
    playerId: {
      type: Schema.slack.types.user_id,
    },
    elo_change: {
      type: Schema.types.number,
    },
  },
});

/**
 * A function definition to compute the change in ELO
 * https://api.slack.com/automation/functions/custom
 */
export const ComputeEloChangeFunctionDefinition = DefineFunction({
  callback_id: "compute_elo_change",
  title: "Compute elo change",
  description: "Computes the elo changes of players after a match.",
  source_file: "functions/compute_elo_change_function.ts",
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
        items: EloChangeProperty,
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
    // TODO Manfred code here
    const winningTeam = inputs.winner === 'team_1' ? inputs.team_1 : inputs.team_2;

    return {
      outputs: {
        elo_changes: inputs.team_1.concat(inputs.team_2)
          .map(playerId => ({
            playerId,
            elo_change: 0,
          })),
      },
    };
  },
);
