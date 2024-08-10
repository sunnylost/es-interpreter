// https://tc39.es/ecma262/#sec-environment-records
import { surroundingAgent } from './agent'
import type { RealmRecord } from './realm'
import type {
    createNormalCompletion,
    DataPropertyDescriptor,
    IsDataDescriptor,
    ReferenceRecord,
    ThisBindingStatusType
} from './types'
import { lexical, empty, initialized, uninitialized, unresolvable, unused } from './types'
import type { ECMAScriptFunction, ECMAScriptObject } from './objects'
import type { ECMAScriptLanguageValue } from './global'
import { Get, HasOwnProperty, HasProperty, IsExtensible, ToBoolean } from './abstractOperations'

export class ExecutionContext {
    codeEvaluationState
    Function // FunctionObject or null
    Realm: RealmRecord
    ScriptOrModule
    LexicalEnvironment: EnvironmentRecord
    VariableEnvironment: EnvironmentRecord
    PrivateEnvironment: EnvironmentRecord
}

export class EnvironmentRecord {
    $type = 'EnvironmentRecord'
    __OuterEnv__ = null
    HasBinding(N: string): boolean {
        // TODO
        console.log('Not implement', N)
        return false
    }
    // CreateMutableBinding(N: string, D: boolean) {}
    // CreateImmutableBinding(N: string, S: boolean) {}
    // InitializeBinding(N: string, V: ECMAScriptLanguageValue) {}
    // SetMutableBinding() {}
    GetBindingValue(N: string, S: boolean) {}
    // DeleteBinding() {}
    // HasThisBinding() {}
    // HasSuperBinding() {}
    // WithBaseObject() {}
}

// 9.1.1.1 https://tc39.es/ecma262/#sec-declarative-environment-records
export class DeclarativeEnvironmentRecord extends EnvironmentRecord {
    $bindings = new Map()
    HasBinding(N: string) {
        return this.$bindings.has(N)
    }

    CreateMutableBinding(N: string, D: boolean) {
        if (this.HasBinding(N)) {
            throw new ReferenceError(`"${N}" already exists.`)
        }
        this.$bindings.set(N, uninitialized)
        return unused
    }

    CreateImmutableBinding(N: string, S: string) {
        if (this.HasBinding(N)) {
            throw new ReferenceError(`"${N}" already exists.`)
        }
        this.$bindings.set(N, uninitialized)

        Object.defineProperty(this.$bindings, N, {
            value: undefined,
            writable: false,
            configurable: false
        })
        // TODO: S for strict
        return unused
    }

    InitializeBinding(N: string, V: ECMAScriptLanguageValue) {
        if (this.$bindings.get(N) !== uninitialized) {
            throw new ReferenceError(`"${N}" already initialised.`)
        }

        this.$bindings.set(N, V)
        return unused
    }

    SetMutableBinding(N: string, V: ECMAScriptLanguageValue, S: boolean) {
        if (!this.$bindings.has(N)) {
            if (S) {
                throw new ReferenceError(`"${N}" not exists.`)
                this.CreateMutableBinding(N, true)
                this.InitializeBinding(N, V)
                return unused
            }
        }

        // 2. If the binding for N in envRec is a strict binding, set S to true.
        if (this.$bindings.get(N) === uninitialized) {
            throw new ReferenceError(`"${N}" not initialised.`)
        }

        if (Object.getOwnPropertyDescriptor(this.$bindings, N).configurable) {
            this.$bindings.set(N, V)
        } else if (S) {
            throw new ReferenceError(`"${N}" is immutable.`)
        }

        return unused
    }

    GetBindingValue(N: string, S: boolean) {
        if (!this.HasBinding(N)) {
            throw new ReferenceError(`"${N}" not exists.`)
        }

        if (this.$bindings.get(N) === uninitialized) {
            throw new ReferenceError(`"${N}" not initialised.`)
        }

        return this.$bindings.get(N)
    }

    DeleteBinding(N: string) {
        if (!this.HasBinding(N)) {
            throw new ReferenceError(`"${N}" not exists.`)
        }

        if (!Object.getOwnPropertyDescriptor(this.$bindings, N).configurable) {
            return false
        }

        this.$bindings.delete(N)
        return true
    }

    HasThisBinding() {
        return false
    }

    HasSuperBinding() {
        return false
    }

    WithBaseObject() {
        return undefined
    }
}

export class FunctionEnvironmentRecord extends DeclarativeEnvironmentRecord {
    __ThisValue__: ECMAScriptLanguageValue = null
    __ThisBindingStatus__: ThisBindingStatusType = null
    __FunctionObject__: ECMAScriptFunction = null
    __NewTarget__: ECMAScriptObject = undefined

    BindThisValue(V: ECMAScriptLanguageValue) {
        // assert [[ThisBindingStatus]] is not lexical
        if (this.__ThisBindingStatus__ === initialized) {
            throw Error('ReferenceError')
        }

        this.__ThisValue__ = V
        this.__ThisBindingStatus__ = initialized
        return V
    }

    HasThisBinding() {
        if (this.__ThisBindingStatus__ === lexical) {
            return false
        }

        return true
    }

    HasSuperBinding() {
        if (this.__ThisBindingStatus__ === lexical) {
            return false
        }

        if (!this.__FunctionObject__.__HomeObject__) {
            return false
        }

        return true
    }

    GetThisBinding() {
        if (this.__ThisBindingStatus__ === uninitialized) {
            throw Error('ReferenceError')
        }

        return this.__ThisValue__
    }

    GetSuperBase() {
        const home = this.__FunctionObject__.__HomeObject__

        if (!home) {
            return undefined
        }

        return home.__GetPrototypeOf__()
    }
}

export class ModuleEnvironmentRecord extends DeclarativeEnvironmentRecord {}

// "with"
// https://tc39.es/ecma262/#table-abstract-methods-of-environment-records
export class ObjectEnvironmentRecord extends EnvironmentRecord {
    // TODO
    __BindingObject__: ECMAScriptObject
    __IsWithEnvironment__: boolean

    HasBinding(N: string) {
        const bindingObject = this.__BindingObject__
        const foundBinding = HasProperty(bindingObject, N)

        if (!foundBinding) {
            return false
        }

        if (!this.__IsWithEnvironment__) {
            return true
        }

        const unscopables = Get(bindingObject, '@@unscopables')

        // isObject
        if (unscopables) {
            const blocked = ToBoolean(Get(unscopables, N))

            if (blocked) {
                return false
            }
        }
        return true
    }

    CreateMutableBinding(N: string, D: boolean) {
        const desc = new DataPropertyDescriptor()
        desc.__Writable__ = D
        this.__BindingObject__[N] = desc
    }

    CreateImmutableBinding(N: string, S: boolean) {
        const desc = new DataPropertyDescriptor()
        desc.__Writable__ = !S
        this.__BindingObject__[N] = desc
    }

    InitializeBinding(N: string, V: ECMAScriptLanguageValue) {
        const binding = this.__BindingObject__[N]

        if (binding) {
            binding
        }
    }

    GetBindingValue(N: string, S: boolean) {
        const bindingObject = this.__BindingObject__
        const value = HasProperty(bindingObject, N)

        if (!value) {
            return
        }

        return Get(bindingObject, N)
    }
}

// 9.1.1.4 https://tc39.es/ecma262/#sec-global-environment-records
// Object Environment Record and Declarative Environment Record
export class GlobalEnvironmentRecord extends EnvironmentRecord {
    readonly __OuterEnv__ = null
    __ObjectRecord__: ObjectEnvironmentRecord = null
    __GlobalThisValue__: ECMAScriptObject = null
    __DeclarativeRecord__: DeclarativeEnvironmentRecord = null
    __VarNames__: string[] = null

    HasBinding(N: string) {
        const DclRec = this.__DeclarativeRecord__

        if (DclRec.HasBinding(N)) {
            return true
        }

        const ObjRec = this.__ObjectRecord__
        return ObjRec.HasBinding(N)
    }

    CreateMutableBinding(N: string, D: boolean) {
        const DclRec = this.__DeclarativeRecord__

        if (DclRec.HasBinding(N)) {
            // throw TypeError
            return
        }

        return DclRec.CreateMutableBinding(N, D)
    }

    CreateImmutableBinding(N: string, S: boolean) {
        const DclRec = this.__DeclarativeRecord__

        if (DclRec.HasBinding(N)) {
            // throw TypeError
            return
        }

        return DclRec.CreateImmutableBinding(N, S)
    }

    InitializeBinding(N: string, V: ECMAScriptLanguageValue) {
        const DclRec = this.__DeclarativeRecord__

        if (DclRec.HasBinding(N)) {
            return DclRec.InitializeBinding(N, V)
        }

        const ObjRec = this.__ObjectRecord__
        return ObjRec.InitializeBinding(N, V)
    }

    SetMutableBinding(N: string, V: ECMAScriptLanguageValue, S: boolean) {
        const DclRec = this.__DeclarativeRecord__

        if (DclRec.HasBinding(N)) {
            return DclRec.SetMutableBinding(N, V, S)
        }
        const ObjRec = this.__ObjectRecord__
        return ObjRec.SetMutableBinding(N, V, S)
    }

    GetBindingValue(N: string, S: boolean) {
        const DclRec = this.__DeclarativeRecord__

        if (DclRec.HasBinding(N)) {
            return DclRec.GetBindingValue(N, S)
        }
        const ObjRec = this.__ObjectRecord__
        return ObjRec.GetBindingValue(N, S)
    }

    DeleteBinding(N: string) {
        const DclRec = this.__DeclarativeRecord__

        if (DclRec.HasBinding(N)) {
            return DclRec.DeleteBinding(N)
        }
        const ObjRec = this.__ObjectRecord__
        const globalObject = ObjRec.__BindingObject__
        const existingProp = HasOwnProperty(globalObject, N)

        if (existingProp) {
            const status = ObjRec.DeleteBinding(N)

            if (status && this.__VarNames__.includes(N)) {
                this.__VarNames__.splice(this.__VarNames__.indexOf(N), 1)
            }

            return status
        }
        return true
    }

    HasThisBinding() {
        return true
    }

    HasSuperBinding() {
        return false
    }

    WithBaseObject() {
        return undefined
    }

    GetThisBinding() {
        return this.__GlobalThisValue__
    }

    HasVarDeclaration(N: string) {
        const varDeclaredNames = this.__VarNames__
        return varDeclaredNames.includes(N)
    }

    HasLexicalDeclaration(N: string) {
        const DclRec = this.__DeclarativeRecord__
        return DclRec.HasBinding(N)
    }

    HasRestrictedGlobalProperty(N: string) {
        const ObjRec = this.__ObjectRecord__
        const globalObject = ObjRec.__BindingObject__
        const existingProp = globalObject.__GetOwnProperty__(N)

        if (!existingProp) {
            return false
        }

        return !existingProp.__Configurable__
    }

    CanDeclareGlobalVar(N: string) {
        const ObjRec = this.__ObjectRecord__
        const globalObject = ObjRec.__BindingObject__
        const hasProperty = HasOwnProperty(globalObject, N)

        if (hasProperty) {
            return true
        }

        return IsExtensible(globalObject)
    }

    CanDeclareGlobalFunction(N: string) {
        const ObjRec = this.__ObjectRecord__
        const globalObject = ObjRec.__BindingObject__
        const existingProp = globalObject.__GetOwnProperty__(N)

        if (!existingProp) {
            return IsExtensible(globalObject)
        }

        if (existingProp.__Configurable__) {
            return true
        }

        return (
            IsDataDescriptor(existingProp) &&
            existingProp.__Writable__ &&
            existingProp.__Enumerable__
        )
    }

    CreateGlobalVarBinding(N: string, D: boolean) {
        const ObjRec = this.__ObjectRecord__
        const globalObject = ObjRec.__BindingObject__
        const hasProperty = HasOwnProperty(globalObject, N)
        const extensible = IsExtensible(globalObject)

        if (!hasProperty && extensible) {
            ObjRec.CreateMutableBinding(N, D)
            ObjRec.InitializeBinding(N, undefined)
        }

        if (!this.__VarNames__.includes(N)) {
            this.__VarNames__.push(N)
        }
        return unused
    }

    CreateGlobalFunctionBinding(N: string, V: ECMAScriptLanguageValue, D: boolean) {
        const ObjRec = this.__ObjectRecord__
        const globalObject = ObjRec.__BindingObject__
        const existingProp = globalObject.__GetOwnProperty__(N)

        let desc: DataPropertyDescriptor

        if (!existingProp || existingProp.__Configurable__) {
            desc = new DataPropertyDescriptor(V)
            desc.__Writable__ = true
            desc.__Enumerable__ = true
            desc.__Configurable__ = D
        } else {
            desc = new DataPropertyDescriptor(V)
        }

        DefinePropertyOrThrow(globalObject, N, desc)
        Set(globalObject, N, V, false)

        if (!this.__VarNames__.includes(N)) {
            this.__VarNames__.push(N)
        }

        return unused
    }
}

// 9.1.2.1
export function GetIdentifierReference(env: EnvironmentRecord, name: string, strict: boolean) {
    if (!env) {
        const ref = new ReferenceRecord()
        ref.__Base__ = unresolvable
        ref.__ReferencedName__ = name
        ref.__Strict__ = strict
        ref.__ThisValue__ = empty
        return createNormalCompletion(ref)
    }

    const exists = env.HasBinding(name)

    if (exists) {
        const ref = new ReferenceRecord()
        ref.__Base__ = env
        ref.__ReferencedName__ = name
        ref.__Strict__ = strict
        ref.__ThisValue__ = empty
        return ref
    } else {
        const outer = env.__OuterEnv__
        return GetIdentifierReference(outer, name, strict)
    }
}

// 9.1.2.2
export function NewDeclarativeEnvironment(E: EnvironmentRecord | null) {
    const env = new DeclarativeEnvironmentRecord()
    env.__OuterEnv__ = E
    return env
}

// 9.1.2.3
export function NewObjectEnvironment(O: ECMAScriptObject, W: boolean, E: EnvironmentRecord | null) {
    const env = new ObjectEnvironmentRecord()
    env.__BindingObject__ = O
    env.__IsWithEnvironment__ = W
    env.__OuterEnv__ = E
    return env
}

// 9.1.2.4
export function NewFunctionEnvironment(F: ECMAScriptFunction, newTarget?: ECMAScriptObject) {
    const env = new FunctionEnvironmentRecord()
    env.__FunctionObject__ = F

    if (F.__ThisMode__ === lexical) {
        env.__ThisBindingStatus__ = lexical
    } else {
        env.__ThisBindingStatus__ = uninitialized
    }
    env.__NewTarget__ = newTarget
    env.__OuterEnv__ = F.__Environment__
    return env
}

// 9.1.2.5
export function NewGlobalEnvironment(G: ECMAScriptObject, thisValue: ECMAScriptObject) {
    const objRec = NewObjectEnvironment(G, false, null)
    const dclRec = NewDeclarativeEnvironment(null)
    const env = new GlobalEnvironmentRecord()
    env.__ObjectRecord__ = objRec
    env.__GlobalThisValue__ = thisValue
    env.__DeclarativeRecord__ = dclRec
    env.__VarNames__ = []
    env.__OuterEnv__ = null
    return env
}

// 9.4.1 https://tc39.es/ecma262/#sec-getactivescriptormodule
function GetActiveScriptOrModule() {
    if (!surroundingAgent.executionContextStack.length) {
        return null
    }

    const ec =
        surroundingAgent.executionContextStack[surroundingAgent.executionContextStack.length - 1]

    if (!ec) {
        return null
    }

    return ec.ScriptOrModule
}

// 9.4.2 https://tc39.es/ecma262/#sec-resolvebinding
export function ResolveBinding(name: string, env?: EnvironmentRecord) {
    if (!env) {
        env = surroundingAgent.runningExecutionContext.LexicalEnvironment
    }

    return GetIdentifierReference(env, name, true)
}

// 9.4.3 https://tc39.es/ecma262/#sec-getthisenvironment
function GetThisEnvironment() {
    let env = surroundingAgent.runningExecutionContext.LexicalEnvironment

    while (true) {
        const exists = env.HasThisBinding()

        if (exists) {
            return env
        }
        let outer = env.__OuterEnv__
        env = outer
    }
}

// 9.4.4
export function ResolveThisBinding() {}

// 9.4.5
export function GetNewTarget() {}

export function GetGlobalObject() {
    const currentRealm = surroundingAgent.runningExecutionContext.Realm
    return currentRealm.__GlobalObject__
}
