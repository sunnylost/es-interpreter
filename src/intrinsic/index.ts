/**
 * https://tc39.es/ecma262/#sec-well-known-intrinsic-objects
 * TODO
 */
import { FunctionPrototype, ThrowTypeError } from '../objects/function'
import { ObjectPrototype } from '../objects/object'

export const IntrinsicObjects = {
    '%AggregateError%': 'AggregateError',
    '%Array%': 'Array',
    '%ArrayBuffer%': 'ArrayBuffer',
    '%Atomics%': 'Atomics',
    '%BigInt%': 'BigInt',
    '%BigInt64Array%': 'BigInt64Array',
    '%BigUint64Array%': 'BigUint64Array',
    '%Boolean%': 'Boolean',
    '%DataView%': 'DataView',
    '%Date%': 'Date',
    '%decodeURI%': 'decodeURI',
    '%decodeURIComponent%': 'decodeURIComponent',
    '%encodeURI%': 'encodeURI',
    '%encodeURIComponent%': 'encodeURIComponent',
    '%Error%': 'Error',
    '%eval%': 'eval',
    '%EvalError%': 'EvalError',
    '%FinalizationRegistry%': 'FinalizationRegistry',
    '%Float32Array%': 'Float32Array',
    '%Float64Array%': 'Float64Array',
    '%Function%': 'Function',
    '%Function.prototype%': FunctionPrototype,
    '%Int8Array%': 'Int8Array',
    '%Int16Array%': 'Int16Array',
    '%Int32Array%': 'Int32Array',
    '%isFinite%': 'isFinite',
    '%isNaN%': 'isNaN',
    '%JSON%': 'JSON',
    '%Map%': 'Map',
    '%Math%': 'Math',
    '%Number%': 'Number',
    '%Object%': 'Object',
    '%Object.prototype%': ObjectPrototype,
    '%parseFloat%': 'parseFloat',
    '%parseInt%': 'parseInt',
    '%Promise%': 'Promise',
    '%Proxy%': 'Proxy',
    '%RangeError%': 'RangeError',
    '%ReferenceError%': 'ReferenceError',
    '%Reflect%': 'Reflect',
    '%RegExp%': 'RegExp',
    '%Set%': 'Set',
    '%SharedArrayBuffer%': 'SharedArrayBuffer',
    '%String%': 'String',
    '%Symbol%': 'Symbol',
    '%SyntaxError%': 'SyntaxError',
    '%TypeError%': 'TypeError',
    '%Uint8Array%': 'Uint8Array',
    '%Uint8ClampedArray%': 'Uint8ClampedArray',
    '%Uint16Array%': 'Uint16Array',
    '%Uint32Array%': 'Uint32Array',
    '%URIError%': 'URIError',
    '%WeakMap%': 'WeakMap',
    '%WeakRef%': 'WeakRef',
    '%WeakSet%': 'WeakSet',
    '%ThrowTypeError%': ThrowTypeError,
    console: {
        log(...args: any[]) {
            console.log.apply(console, args)
        }
    }
}
