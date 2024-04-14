import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { GenerateMatchHistoryFunctionDefinition } from '../functions/generate_match_history_function.ts'

/**
 * A workflow to view the match history.
 *
 * https://api.slack.com/automation/workflows
 * https://api.slack.com/automation/forms#add-interactivity
 */
const ViewMatchHistoryWorkflow = DefineWorkflow({
  callback_id: 'view_match_history_workflow',
  title: 'View match history',
  description: 'View the match history',
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      requester: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ['interactivity', 'requester'],
  },
})

const generateMatchHistoryStep = ViewMatchHistoryWorkflow.addStep(GenerateMatchHistoryFunctionDefinition, {
  requester: ViewMatchHistoryWorkflow.inputs.requester,
})

ViewMatchHistoryWorkflow.addStep(Schema.slack.functions.SendDm, {
  user_id: ViewMatchHistoryWorkflow.inputs.requester,
  message: generateMatchHistoryStep.outputs.match_history,
})

export default ViewMatchHistoryWorkflow
