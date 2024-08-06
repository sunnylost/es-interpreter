// https://tc39.es/ecma262/#sec-code-realms
import { ExecutionContext, GlobalEnvironmentRecord, NewGlobalEnvironment } from './env'
import { surroundingAgent } from './agent'
import { ECMAScriptFunction, ECMAScriptObject, OrdinaryObjectCreate } from './objects/object'
import { IntrinsicObjects } from './intrinsic'
import { CompletionRecord, CompletionRecordType, DataPropertyDescriptor, unused } from './types'
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
    realmRec.__Intrinsics__ = IntrinsicObjects
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
    if (globalObj === undefined) {
        const __Intrinsics__ = realmRec.__Intrinsics__
        const intrinsics = new ECMAScriptObject()

        Object.keys(__Intrinsics__).forEach((key) => {
            // TODO
            const desc = new DataPropertyDescriptor()
            desc.__Writable__ = false
            desc.__Configurable__ = false
            desc.__Enumerable__ = true
            desc.__Value__ = __Intrinsics__[key]
            intrinsics.property[key] = desc
        })

        globalObj = OrdinaryObjectCreate(intrinsics)
    }

    if (thisValue === undefined) {
        thisValue = globalObj
    }
    realmRec.__GlobalObject__ = globalObj
    realmRec.__GlobalEnv__ = NewGlobalEnvironment(globalObj, thisValue)
}

function SetDefaultGlobalBindings(realmRec: RealmRecord) {
    // TODO
    const global = realmRec.__GlobalObject__
    console.log('global', global)
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
