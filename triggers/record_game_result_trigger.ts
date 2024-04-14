import { Trigger } from 'deno-slack-sdk/types.ts'
import { TriggerContextData, TriggerTypes } from 'deno-slack-api/mod.ts'
import RecordGameResultWorkflow from '../workflows/record_game_result_workflow.ts'

/**
 * A trigger to start the RecordGameResult Workflow
 * https://api.slack.com/automation/triggers
 */
const RecordGameResultTrigger: Trigger<typeof RecordGameResultWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: 'Ping pong new match',
  description: 'Record the results of a ping pong match.',
  workflow: `#/workflows/${RecordGameResultWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    requester: {
      value: TriggerContextData.Shortcut.user_id,
    },
  },
}

export default RecordGameResultTrigger
