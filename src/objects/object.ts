import { Call, IsExtensible, MakeBasicObject, SameValue } from '../abstractOperations'
import {
    AccessorPropertyDescriptor,
    ConstructorKindType,
    createNormalCompletion,
    DataPropertyDescriptor,
    IsAccessorDescriptor,
    IsDataDescriptor,
    ParseNode,
    PropertyDescriptor,
    ThisModeType
} from '../types'
import { ECMAScriptLanguageValue } from '../global'
import { EnvironmentRecord } from '../env'
import { RealmRecord } from '../realm'
import { ScriptRecord } from '../script'
import { ModuleRecord } from '../module'

// https://tc39.es/ecma262/#sec-object-type
// https://tc39.es/ecma262/#sec-ordinary-and-exotic-objects-behaviours
export class ECMAScriptObject implements ECMAScriptLanguageValue {
    $type = 'object'
    // An integer index is a String-valued property key that is a canonical numeric string and whose numeric value is either +0𝔽 or a positive integral Number ≤ 𝔽(253 - 1). An array index is an integer index whose numeric value i is in the range +0𝔽 ≤ i < 𝔽(232 - 1).
    property: {
        [x in PropertyKey]: PropertyDescriptor
    }

    __Extensible__: boolean
    __PrivateElements__
    __Prototype__: ECMAScriptObject | null

    constructor() {
        this.property = Object.create(null)
        this.__Extensible__ = undefined
        this.__PrivateElements__ = undefined
        this.__Prototype__ = null
    }

    /**
     * https://tc39.es/ecma262/#sec-invariants-of-the-essential-internal-methods
     * 必须返回 Completion
     */
    __GetPrototypeOf__() {
        return OrdinaryGetPrototypeOf(this)
    }
    __SetPrototypeOf__(V: ECMAScriptObject | null) {
        return OrdinarySetPrototypeOf(this, V)
    }
    __IsExtensible__() {
        return OrdinaryIsExtensible(this)
    }
    __PreventExtensions__() {
        return OrdinaryPreventExtensions(this)
    }
    __GetOwnProperty__(P: PropertyKey) {
        return OrdinaryGetOwnProperty(this, P)
    }
    __DefineOwnProperty__(P: PropertyKey, Desc: PropertyDescriptor) {
        return OrdinaryDefineOwnProperty(this, P, Desc)
    }
    __HasProperty__(P: PropertyKey) {
        return OrdinaryHasProperty(this, P)
    }
    // TODO: can throw
    __Get__(P: PropertyKey, Receiver: ECMAScriptLanguageValue) {
        return OrdinaryGet(this, P, Receiver)
    }
    __Set__(P: PropertyKey, V: ECMAScriptLanguageValue, Receiver?: ECMAScriptLanguageValue) {
        const desc = this.__GetOwnProperty__(P)

        if (
            !(desc as DataPropertyDescriptor).__Configurable__ &&
            !(desc as DataPropertyDescriptor).__Writable__ &&
            !SameValue((desc as DataPropertyDescriptor).__Value__, V)
        ) {
            return false
        }

        if (
            !(desc as AccessorPropertyDescriptor).__Configurable__ &&
            !(desc as AccessorPropertyDescriptor).__Set__
        ) {
            return false
        }
    }
    __Delete__(P: PropertyKey) {}
    __OwnPropertyKeys__() {
        return createNormalCompletion<ReturnType<typeof OrdinaryOwnPropertyKeys>>(
            OrdinaryOwnPropertyKeys(this)
        )
    }
}

export class ECMAScriptFunction extends ECMAScriptObject {
    __Environment__: EnvironmentRecord
    __PrivateEnvironment__: PrivateEnvironmentRecord | null
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
    __Call__() {}
    __Construct__() {}
}

export class ECMAScriptString extends ECMAScriptObject {
    PrimitiveValue: string
}

function OrdinaryGetPrototypeOf(O: ECMAScriptObject) {
    return O.__Prototype__
}

function OrdinarySetPrototypeOf(O: ECMAScriptObject, V: ECMAScriptObject | null) {
    const current = O.__Prototype__

    if (SameValue(V, current)) {
        return true
    }

    const extensible = O.__Extensible__

    if (!extensible) {
        return false
    }

    let p = V
    let done = false

    while (!done) {
        if (p === null) {
            done = true
        } else if (SameValue(p, O)) {
            return false
        } else {
            // TODO: not ordinary object internal method
            // if (p.__GetPrototypeOf__) {
            //
            // }
            p = p.__Prototype__
        }
    }

    O.__Prototype__ = V
    return true
}

function OrdinaryIsExtensible(O: ECMAScriptObject) {
    return O.__Extensible__
}

function OrdinaryPreventExtensions(O: ECMAScriptObject) {
    O.__Extensible__ = false
    return true
}

function OrdinaryGetOwnProperty(
    O: ECMAScriptObject,
    P: PropertyKey
): PropertyDescriptor | undefined {
    if (!(P in O.property)) {
        return undefined
    }

    const X = O.property[P]
    let D

    if (IsDataDescriptor(X)) {
        D = new DataPropertyDescriptor(X.__Value__)
        D.__Writable__ = X.__Writable__
    } else if (IsAccessorDescriptor(X)) {
        D = new AccessorPropertyDescriptor()
        D.__Get__ = X.__Get__
        D.__Set__ = X.__Set__
    }

    return D as PropertyDescriptor
}

function OrdinaryDefineOwnProperty(O: ECMAScriptObject, P: PropertyKey, Desc: PropertyDescriptor) {
    const current = O.__GetOwnProperty__(P)
    const extensible = IsExtensible(O)
    return ValidateAndApplyPropertyDescriptor(O, P, extensible, Desc, current)
}

// TODO
function ValidateAndApplyPropertyDescriptor(
    O: ECMAScriptObject,
    P: PropertyKey,
    extensible: boolean,
    Desc: PropertyDescriptor,
    current?: PropertyDescriptor
) {}

function OrdinaryHasProperty(O: ECMAScriptObject, P: PropertyKey) {
    const hasOwn = O.__GetOwnProperty__(P)

    if (hasOwn) {
        return true
    }

    const parent = O.__GetPrototypeOf__()

    if (parent) {
        return parent.__HasProperty__(P)
    }

    return false
}

function OrdinaryGet(O: ECMAScriptObject, P: PropertyKey, Receiver: ECMAScriptLanguageValue) {
    const desc = O.__GetOwnProperty__(P)

    if (!desc) {
        const parent = O.__GetPrototypeOf__()

        if (!parent) {
            return undefined
        }

        return parent.__Get__(P, Receiver)
    }

    if (IsDataDescriptor(desc)) {
        return desc.__Value__
    }

    const getter = (desc as AccessorPropertyDescriptor).__Get__

    if (!getter) {
        return undefined
    }

    return Call(getter, Receiver)
}

// Skip https://tc39.es/ecma262/#sec-ordinaryownpropertykeys
function OrdinaryOwnPropertyKeys(O: ECMAScriptObject) {
    const keys = [...Object.keys(O.property)]
    return keys
}

export function OrdinaryObjectCreate(
    proto: ECMAScriptObject | null,
    additionalInternalSlotsList?: string[]
) {
    let internalSlotsList = ['__Prototype__', '__Extensible__']

    if (additionalInternalSlotsList) {
        internalSlotsList = [...internalSlotsList, ...additionalInternalSlotsList]
    }

    const O = MakeBasicObject(internalSlotsList)
    O.__Prototype__ = proto // use ordinary function?
    return O
}

// TODO
export const ObjectPrototype = new ECMAScriptObject()
