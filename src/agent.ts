// https://tc39.es/ecma262/#sec-agents

import { ExecutionContext } from './env'

export interface Agent {
    executionContextList: ExecutionContext[]
    executionContextStack: ExecutionContext[]
    runningExecutionContext: ExecutionContext
    executingThread: ExecutionContext // ?
}

export const surroundingAgent: Agent = {
    executionContextList: [],
    executionContextStack: [],
    runningExecutionContext: null,
    executingThread: null
}
