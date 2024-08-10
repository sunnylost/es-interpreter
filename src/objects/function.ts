import { ECMAScriptObject } from './object'
import type { FunctionDeclaration } from '../astNodeTypes'
import { type EnvironmentRecord, ExecutionContext, NewFunctionEnvironment } from '../env'
import {
    lexical,
    strict,
    unused,
    type ConstructorKindType,
    type ParseNode,
    type ThisModeType
} from '../types'
import type { RealmRecord } from '../realm'
import type { ScriptRecord } from '../script'
import type { ModuleRecord } from '../module'
import type { ECMAScriptLanguageValue } from '../global'
import { surroundingAgent } from '../agent'
import { EvaluateBody } from '../evaluate'

export class ECMAScriptFunction extends ECMAScriptObject {
    __Environment__: EnvironmentRecord
    __PrivateEnvironment__: null // TODO
    __FormalParameters__: ParseNode
    __ECMAScriptCode__: ParseNode
    __ConstructorKind__: ConstructorKindType
    __Realm__: RealmRecord
    __ScriptOrModule__: ScriptRecord | ModuleRecord
    __ThisMode__: ThisModeType
    __Strict__: boolean
    __HomeObject__: ECMAScriptObject
    __SourceText__: string
    __Fields__: any // TODO
    __PrivateMethods__: any // TODO
    __ClassFieldInitializerName__: any // TODO
    __IsClassConstructor__: boolean

    __Call__(thisArgument: ECMAScriptLanguageValue, argumentList: ECMAScriptLanguageValue[]) {
        console.log('function call')
        const F = this
        const callerContext = surroundingAgent.runningExecutionContext
        const calleeContext = PrepareForOrdinaryCall(F, undefined)

        if (this.__IsClassConstructor__) {
            // error
            surroundingAgent.executionContextStack.pop()
            return
        }

        OrdinaryCallBindThis(F, calleeContext, thisArgument)
        const result = OrdinaryCallEvaluateBody(F, argumentList)

        // error
        return result.__Value__
    }
    __Construct__() {}
}

function PrepareForOrdinaryCall(F: ECMAScriptFunction, newTarget: undefined | ECMAScriptObject) {
    const callerContext = surroundingAgent.runningExecutionContext
    const calleeContext = new ExecutionContext()
    calleeContext.Function = F
    const calleeRealm = F.__Realm__
    calleeContext.Realm = calleeRealm
    calleeContext.ScriptOrModule = F.__ScriptOrModule__
    const localEnv = NewFunctionEnvironment(F, newTarget)
    calleeContext.LexicalEnvironment = localEnv
    calleeContext.VariableEnvironment = localEnv
    calleeContext.PrivateEnvironment = F.__PrivateEnvironment__
    // TODO
    // suspendExecutionContext(callerContext)
    surroundingAgent.executionContextStack.push(calleeContext)
    return calleeContext
}

function OrdinaryCallBindThis(
    F: ECMAScriptFunction,
    calleeContext: ExecutionContext,
    thisArgument: ECMAScriptLanguageValue
) {
    const thisMode = F.__ThisMode__

    if (thisMode === lexical) {
        return unused
    }
    const calleeRealm = F.__Realm__
    const localEnv = calleeContext.LexicalEnvironment

    let thisValue

    if (thisMode === strict) {
        thisValue = thisArgument
    } else {
        // jump
    }

    localEnv.BindThisValue(thisValue)
    return unused
}

function OrdinaryCallEvaluateBody(F: ECMAScriptFunction, argumentsList: ECMAScriptLanguageValue[]) {
    return EvaluateBody(F.__ECMAScriptCode__, F, argumentsList)
}

export const FunctionPrototype = new ECMAScriptFunction()

export function ThrowTypeError() {
    throw new TypeError('TODO: Type error')
}

// TODO
export function InstantiateFunctionObject(f: FunctionDeclaration) {
    console.log(f)
}

export function InstantiateOrdinaryFunctionObject() {}

export function InstantiateGeneratorFunctionObject() {}

export function InstantiateAsyncGeneratorFunctionObject() {}

export function InstantiateAsyncFunctionObject() {}
