import { Trigger } from 'deno-slack-sdk/types.ts'
import { TriggerContextData, TriggerTypes } from 'deno-slack-api/mod.ts'
import ViewPlayersStandingsWorkflow from '../workflows/view_players_standings_workflow.ts'

/**
 * A trigger to start the ViewPlayersStandings Workflow
 * https://api.slack.com/automation/triggers
 */
const ViewPlayersStandingsTrigger: Trigger<typeof ViewPlayersStandingsWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: 'Ping pong view standings',
  description: 'View the ping pong standings.',
  workflow: `#/workflows/${ViewPlayersStandingsWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    requester: {
      value: TriggerContextData.Shortcut.user_id,
    },
  },
}

export default ViewPlayersStandingsTrigger
