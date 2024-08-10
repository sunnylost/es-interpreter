// https://tc39.es/ecma262/#sec-ecmascript-data-types-and-values
import type { Program } from 'acorn'
import type { EnvironmentRecord } from './env'
import type { ECMAScriptLanguageValue } from './global'
import { $is } from './util'
import { ToObject } from './abstractOperations'
import type { OrdinaryObjectCreate, ECMAScriptFunction } from './objects'
import type { VariableDeclaration } from './astNodeTypes'

export enum CompletionRecordType {
    normal,
    break,
    continue,
    return,
    throw
}

export class CompletionRecord<T = any> {
    $type = 'ReferenceRecord'
    __Type__: CompletionRecordType = null
    __Value__: T = null
    __Target__ = ''

    constructor(type: CompletionRecordType, value: T, target: string) {
        this.__Type__ = type
        this.__Value__ = value
        this.__Target__ = target
    }
}

export const unresolvable = Symbol.for('unresolvable')
export const empty = Symbol.for('empty')
export const lexical = Symbol.for('lexical')
export const initialized = Symbol.for('initialized')
export const uninitialized = Symbol.for('uninitialized')
export const base = Symbol.for('base')
export const derived = Symbol.for('derived')
export const strict = Symbol.for('strict')
export const global = Symbol.for('global')
export const unused = Symbol.for('unused')

export type ThisBindingStatusType = typeof lexical | typeof initialized | typeof uninitialized

export type ThisModeType = typeof lexical | typeof strict | typeof global

export type ConstructorKindType = typeof base | typeof derived

export type ParseNode = {
    type?: string // TODO
    node: Program
    LexicallyDeclaredNames: string[]
    VarDeclaredNames: string[]
    VarScopedDeclarations: VariableDeclaration[] // TODO: more
    LexicallyScopedDeclarations: VariableDeclaration[] // TODO: more
} // TODO

export class ReferenceRecord {
    $type = 'ReferenceRecord'
    __Base__: ECMAScriptLanguageValue | EnvironmentRecord | typeof unresolvable
    __ReferencedName__: string | symbol // private Name
    __Strict__: boolean
    __ThisValue__: ECMAScriptLanguageValue | typeof empty
}

export function IsPropertyReference(V: ReferenceRecord) {
    if (V.__Base__ === unresolvable) {
        return false
    }

    // environment record
    if ($is<EnvironmentRecord>(V.__Base__, 'EnvironmentRecord')) {
        return false
    }

    return true
}

export function IsUnresolvableReference(V: ReferenceRecord) {
    if (V.__Base__ === unresolvable) {
        return true
    }

    return false
}

export function IsSuperReference(V: ReferenceRecord) {
    if (V.__ThisValue__) {
        return true
    }

    return false
}

// TODO: 6.2.5.4
export function IsPrivateReference(V: ReferenceRecord) {
    return false //V.__ReferencedName__
}

export function GetThisValue(V: ReferenceRecord) {
    return IsSuperReference(V) ? V.__ThisValue__ : V.__Base__
}

// TODO
export function GetValue(V: ReferenceRecord | ECMAScriptLanguageValue) {
    if (!$is<ReferenceRecord>(V, 'ReferenceRecord')) {
        return V
    }

    if (IsUnresolvableReference(V)) {
        // TODO: throwException(ReferenceError)
        return
    }

    if (IsPropertyReference(V)) {
        const baseObj = ToObject(V.__Base__ as ECMAScriptLanguageValue)

        if (IsPrivateReference(V)) {
            return PrivateGet(baseObj, V.__ReferencedName__)
        }

        return baseObj.__Value__.__Get__(V.__ReferencedName__, GetThisValue(V))
    } else {
        const base = V.__Base__
        return base.GetBindingValue(V.__ReferencedName__, true)
    }
}

export class PropertyDescriptor {
    __Enumerable__ = false
    __Configurable__ = false
}

export class DataPropertyDescriptor extends PropertyDescriptor {
    __Value__: ECMAScriptLanguageValue = undefined
    __Writable__ = false

    constructor(value = undefined) {
        super()
        this.__Value__ = value
    }
}

export class AccessorPropertyDescriptor extends PropertyDescriptor {
    __Get__: ECMAScriptFunction | undefined
    __Set__: ECMAScriptFunction | undefined
}

export function IsAccessorDescriptor(
    Desc: PropertyDescriptor | undefined
): Desc is AccessorPropertyDescriptor {
    if (!Desc) {
        return false
    }

    if ('__Get__' in Desc) {
        return true
    }

    if ('__Set__' in Desc) {
        return true
    }

    return false
}

export function IsDataDescriptor(
    Desc: PropertyDescriptor | undefined
): Desc is DataPropertyDescriptor {
    if (!Desc) {
        return false
    }

    if ('__Value__' in Desc) {
        return true
    }

    if ('__Writable__' in Desc) {
        return true
    }

    return false
}

export function IsGenericDescriptor(
    Desc: PropertyDescriptor | undefined
): Desc is PropertyDescriptor {
    if (!Desc) {
        return false
    }

    if (IsAccessorDescriptor(Desc)) {
        return false
    }

    if (IsDataDescriptor(Desc)) {
        return false
    }

    return true
}

export function FromPropertyDescriptor(Desc) {
    if (!Desc) {
        return undefined
    }

    const obj = OrdinaryObjectCreate()
}

export function createNormalCompletion<T>(value: T) {
    return new CompletionRecord<T>(CompletionRecordType.normal, value, '')
}

export function createThrowCompletion<T>(value: T) {
    return new CompletionRecord<T>(CompletionRecordType.throw, value, '')
}

export function UpdateEmpty(completionRecord: CompletionRecord, value: any) {
    if (completionRecord.__Value__ !== '') {
        return completionRecord
    }

    return new CompletionRecord(completionRecord.__Type__, value, completionRecord.__Target__)
}
