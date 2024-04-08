import { Trigger } from 'deno-slack-sdk/types.ts'
import { TriggerContextData, TriggerTypes } from 'deno-slack-api/mod.ts'
import RecordGameResultWorkflow from '../workflows/record_game_result_workflow.ts'

/**
 * A trigger to start the RecordGameResult Workflow
 * https://api.slack.com/automation/triggers
 */
const RecordGameResultTrigger: Trigger<typeof RecordGameResultWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: 'RecordGameResult trigger',
  description: 'Starts the workflow to record a new game.',
  workflow: `#/workflows/${RecordGameResultWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    user: {
      value: TriggerContextData.Shortcut.user_id,
    },
  },
}

export default RecordGameResultTrigger
