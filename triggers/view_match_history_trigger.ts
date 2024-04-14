import { Trigger } from 'deno-slack-sdk/types.ts'
import { TriggerContextData, TriggerTypes } from 'deno-slack-api/mod.ts'
import ViewMatchHistoryWorkflow from '../workflows/view_match_history_workflow.ts'

/**
 * A trigger to start the ViewMatchHistory Workflow
 * https://api.slack.com/automation/triggers
 */
const ViewMatchHistoryTrigger: Trigger<typeof ViewMatchHistoryWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: 'Ping pong view match history',
  description: 'View the ping pong match history.',
  workflow: `#/workflows/${ViewMatchHistoryWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    requester: {
      value: TriggerContextData.Shortcut.user_id,
    },
  },
}

export default ViewMatchHistoryTrigger
