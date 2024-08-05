import { BooleanConstructor } from './boolean'
import { DataPropertyDescriptor } from '../types'
import { surroundingAgent } from '../agent'

export function initGlobalThis() {
    // TODO
    const _globalThis = new DataPropertyDescriptor(
        surroundingAgent.runningExecutionContext.Realm.__GlobalEnv__.__GlobalThisValue__
    )
    _globalThis.__Writable__ = globalThis.__Configurable__ = true

    const _Infinity = new DataPropertyDescriptor(Number.POSITIVE_INFINITY) // TODO
    const _NaN = new DataPropertyDescriptor(Number.NaN)
    const _undefined = new DataPropertyDescriptor(undefined)

    return {
        globalThis: _globalThis,
        Infinity: _Infinity,
        NaN: _NaN,
        undefined: _undefined,
        Boolean: BooleanConstructor
    }
}
