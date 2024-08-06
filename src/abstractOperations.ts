// https://tc39.es/ecma262/#sec-abstract-operations

import { ECMAScriptLanguageValue, PropertyKey } from './global'
import { $is } from './util'
import { ECMAScriptFunction, ECMAScriptObject, ECMAScriptString } from './objects/object'
import {
    createThrowCompletion,
    createNormalCompletion,
    unused,
    PropertyDescriptor,
    DataPropertyDescriptor
} from './types'

// 7.1 Type Conversion

// 7.1.1 https://tc39.es/ecma262/#sec-toprimitive
export function ToPrimitive(input: ECMAScriptLanguageValue, preferredType?: string) {
    // TODO: $is
    if ($is(input, 'object')) {
        const exoticToPrim = GetMethod(input, '@@toPrimitive')
        let hint: string

        if (exoticToPrim) {
            if (!preferredType) {
                hint = 'default'
            } else if (preferredType === 'string') {
                hint = 'string'
            } else if (preferredType === 'number') {
                hint = 'number'
            }

            const result = Call(exoticToPrim, input, hint)

            // TODO
            if (!$is(result, 'object')) {
                return result
            }
            return createThrowCompletion(input)
        }

        if (!preferredType) {
            preferredType = 'number'
        }

        return OrdinaryToPrimitive(input, preferredType)
    }

    // TODO
    return input.PrimitiveValue
}

export function OrdinaryToPrimitive(O, hint: string) {
    let methodNames: string[]

    if (hint === 'string') {
        methodNames = ['toString', 'valueOf']
    } else {
        methodNames = ['valueOf', 'toString']
    }

    for (const name of methodNames) {
        const method = Get(O, name)

        if (IsCallable(method)) {
            const result = Call(method, O)

            if (!$is(result, 'object')) {
                return result
            }
        }
    }

    // TODO
    // ThrowException(TypeError)
}

// 7.1.17
export function ToString(argument: ECMAScriptLanguageValue) {
    if ($is<ECMAScriptString>(argument, 'string')) {
        return argument.PrimitiveValue
    }

    if ($is(argument, 'symbol')) {
        throw new Error('Symbol cannot be convert to string')
    }

    if ($is(argument, 'undefined')) {
        return 'undefined'
    }

    if ($is(argument, 'null')) {
        return 'null'
    }

    if ($is(argument, 'boolean')) {
        // TODO
        return argument.PrimitiveValue === true ? 'true' : 'false'
    }

    /*
7. If argument is a Number, return Number::toString(argument, 10).
8. If argument is a BigInt, return BigInt::toString(argument, 10).
     */

    if ($is(argument, 'object')) {
        const primValue = ToPrimitive(argument, 'string')
        return ToString(primValue)
    }
}

// 7.1.18
export function ToObject(argument: ECMAScriptLanguageValue) {
    if ($is(argument, 'undefined') || $is(argument, 'null')) {
        return createThrowCompletion(argument)
    }

    return createNormalCompletion<ECMAScriptLanguageValue>(argument)
}

export function ToBoolean(argument: ECMAScriptLanguageValue) {
    if ($is(argument, 'boolean')) {
        return argument
    }

    // TODO: B.3.6.1
    if ($is(argument, '')) {
        return false
    }

    return true
}

// 7.2 Testing and Comparison Operations

// 7.2.2 TODO
export function IsArray(argument: ECMAScriptLanguageValue) {
    // not an object
    // array exotic object
}

// 7.2.3 TODO
export function IsCallable(argument: ECMAScriptLanguageValue) {
    // not an object

    if ('__Call__' in argument) {
        return true
    }

    return false
}

// 7.2.5
export function IsExtensible(O: ECMAScriptObject) {
    return O.__IsExtensible__()
}

// 7.2.10
export function SameValue(x: ECMAScriptLanguageValue, y: ECMAScriptLanguageValue) {
    if (Type(x) !== Type(y)) {
        return false
    }

    if ($is(x, 'number')) {
        return // Number::sameValue(x, y)
    }

    return SameValueNonNumber(x, y)
}

// 7.2.11
export function SameValueZero(x: ECMAScriptLanguageValue, y: ECMAScriptLanguageValue) {
    if (Type(x) !== Type(y)) {
        return false
    }

    if ($is(x, 'number')) {
        return // Number::sameValueZero(x, y)
    }

    return SameValueNonNumber(x, y)
}

// TODO 7.2.12
export function SameValueNonNumber(x: ECMAScriptLanguageValue, y: ECMAScriptLanguageValue) {
    if ($is(x, 'null') || $is(x, 'undefined')) {
        return true
    }

    if ($is(x, 'BigInt')) {
        // BigInt::equal(x,y)
    }
}

// 7.3 Operations on Objects

// 7.3.1 https://tc39.es/ecma262/#sec-makebasicobject 所有对象创建
export function MakeBasicObject(internalSlotsList: any[]) {
    const obj = new ECMAScriptObject()

    internalSlotsList.forEach((slot) => {
        obj[slot] = undefined
    })

    if (internalSlotsList.includes('__Extensible__')) {
        obj.__Extensible__ = true
    }
    return obj
}

// 7.3.2
export function Get<T>(O: ECMAScriptObject, P: PropertyKey): T {
    return O.__Get__(P, O)
}

// 7.3.3
export function GetV(V: ECMAScriptLanguageValue, P: PropertyKey) {
    const O = ToObject(V)
    return O.__Value__.__Get__(P, V)
}

// 7.3.4
export function Set(
    O: ECMAScriptObject,
    P: PropertyKey,
    V: ECMAScriptLanguageValue,
    Throw: boolean
) {
    const success = O.__Set__(P, V, O)

    if (!success && Throw) {
        return createThrowCompletion(V)
    }

    return unused
}

// 7.3.5
export function CreateDataProperty(
    O: ECMAScriptObject,
    P: PropertyKey,
    V: ECMAScriptLanguageValue
) {
    const newDesc = {
        __Value__: V,
        __Writable__: true,
        __Enumerable__: true,
        __Configurable__: true
    } as DataPropertyDescriptor
    return O.__DefineOwnProperty__(P, newDesc)
}

// 7.3.6
export function CreateDataPropertyOrThrow(
    O: ECMAScriptObject,
    P: PropertyKey,
    V: ECMAScriptLanguageValue
) {
    const success = CreateDataProperty(O, P, V)

    if (!success) {
        return createThrowCompletion(O)
    }

    return unused
}

// 7.3.7
export function CreateNonEnumerableDataPropertyOrThrow(
    O: ECMAScriptObject,
    P: PropertyKey,
    V: ECMAScriptLanguageValue
) {
    const newDesc = {
        __Value__: V,
        __Writable__: true,
        __Enumerable__: false,
        __Configurable__: true
    } as DataPropertyDescriptor
    DefinePropertyOrThrow(O, P, newDesc)
    return unused
}

// 7.3.8
export function DefinePropertyOrThrow(
    O: ECMAScriptObject,
    P: PropertyKey,
    desc: PropertyDescriptor
) {
    const success = O.__DefineOwnProperty__(P, desc)

    if (!success) {
        return createThrowCompletion(O)
    }
    return unused
}

// 7.3.9
export function DeletePropertyOrThrow(O: ECMAScriptObject, P: PropertyKey) {
    const success = O.__Delete__(P)

    if (!success) {
        return createThrowCompletion(V)
    }
    return unused
}

// 7.3.10
export function GetMethod(V: ECMAScriptLanguageValue, P: PropertyKey) {
    const func = GetV(V, P)

    if (func === undefined || func === null) {
        return undefined
    }

    if (!IsCallable(func)) {
        return createThrowCompletion(V)
    }

    return func
}

// 7.3.11
export function HasProperty(O: ECMAScriptObject, P: PropertyKey) {
    return O.__HasProperty__(P)
}

// 7.3.12
export function HasOwnProperty(O: ECMAScriptObject, P: PropertyKey) {
    const desc = O.__GetOwnProperty__(P)
    return !!desc
}

// 7.3.13
export function Call(
    F: ECMAScriptLanguageValue,
    V: ECMAScriptLanguageValue,
    argumentsList: ECMAScriptLanguageValue[] = []
) {
    if (!IsCallable(F)) {
        // throw
        return
    }

    return (F as ECMAScriptFunction).__Call__(V, argumentsList)
}

// 7.3.14
export function Construct(F: ECMAScriptFunction, argumentList = [], newTarget = F) {
    return F.__Construct__(argumentList, newTarget)
}
