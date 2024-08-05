import { ParseScript, ScriptEvaluation } from './script'
import { surroundingAgent } from './agent'

export function interpret(sourceCode: string) {
    // Script/Module
    const scriptRecord = ParseScript(sourceCode, surroundingAgent.runningExecutionContext.Realm)

    return ScriptEvaluation(scriptRecord)
}
