import type { Agent } from './agent'

declare global {
    interface Window {
        surroundingAgent: Agent
    }
}

// TODO
export interface ECMAScriptLanguageValue {
    $type: string
    PrimitiveValue?: any
}

export type PropertyKey = string | symbol

export {}
