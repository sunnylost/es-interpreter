// https://tc39.es/ecma262/#sec-code-realms
import { ExecutionContext, GlobalEnvironmentRecord, NewGlobalEnvironment } from './env'
import { surroundingAgent } from './agent'
import { ECMAScriptFunction, ECMAScriptObject, OrdinaryObjectCreate } from './objects/object'
import { IntrinsicObjects } from './intrinsic'
import { AccessorPropertyDescriptor, PropertyDescriptor, unused } from './types'
import { DefinePropertyOrThrow } from './abstractOperations'

export class RealmRecord {
    __AgentSignifier__ = ''
    __Intrinsics__ = null
    __GlobalObject__ = undefined
    __GlobalEnv__: GlobalEnvironmentRecord = null
    __TemplateMap__ = null
    __LoadedModules__ = null
    __HostDefined__ = undefined
}

// https://tc39.es/ecma262/#sec-createrealm
export function CreateRealm() {
    const realmRec = new RealmRecord()
    CreateIntrinsics(realmRec)
    realmRec.__GlobalObject__ = undefined
    realmRec.__GlobalEnv__ = undefined
    realmRec.__TemplateMap__ = []
    return realmRec
}

function CreateIntrinsics(realmRec: RealmRecord) {
    realmRec.__Intrinsics__ = IntrinsicObjects // new Record
    AddRestrictedFunctionProperties(realmRec.__Intrinsics__['%Function.prototype%'], realmRec)
}

export function InitializeHostDefinedRealm() {
    const realm = CreateRealm()
    const newContext = new ExecutionContext()
    newContext.Function = null
    newContext.Realm = realm
    newContext.ScriptOrModule = null
    surroundingAgent.runningExecutionContext = newContext
    surroundingAgent.executionContextStack.push(newContext)
    const global = undefined
    const thisValue = undefined
    SetRealmGlobalObject(realm, global, thisValue)
    SetDefaultGlobalBindings(realm)
}

function SetRealmGlobalObject(
    realmRec: RealmRecord,
    globalObj: ECMAScriptObject | undefined,
    thisValue: ECMAScriptObject | undefined
) {
    let intrinsics

    if (globalObj === undefined) {
        intrinsics = realmRec.__Intrinsics__
        globalObj = OrdinaryObjectCreate(intrinsics)
    }

    if (thisValue === undefined) {
        thisValue = globalObj
    }
    realmRec.__GlobalObject__ = globalObj
    const newGlobalEnv = NewGlobalEnvironment(globalObj, thisValue)
    realmRec.__GlobalEnv__ = newGlobalEnv
}

function SetDefaultGlobalBindings(realmRec: RealmRecord) {
    // TODO
}

function AddRestrictedFunctionProperties(F: ECMAScriptFunction, realm: RealmRecord) {
    const thrower = realm.__Intrinsics__['%ThrowTypeError%']
    DefinePropertyOrThrow(F, 'caller', {
        __Get__: thrower,
        __Set__: thrower,
        __Configurable__: true,
        __Enumerable__: false
    })
    DefinePropertyOrThrow(F, 'arguments', {
        __Get__: thrower,
        __Set__: thrower,
        __Configurable__: true,
        __Enumerable__: false
    })
    return unused
}
