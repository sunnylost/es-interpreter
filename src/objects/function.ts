import { ECMAScriptFunction } from './object'
import { FunctionDeclaration } from '../astNodeTypes'

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
