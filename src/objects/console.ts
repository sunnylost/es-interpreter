import { ECMAScriptFunction } from './function'
import { ECMAScriptObject } from './object'
import { DataPropertyDescriptor } from '../types'

export const Console = new ECMAScriptObject()
Console.__Extensible__ = true

const logDesc = new DataPropertyDescriptor()
logDesc.__Value__ = new ECMAScriptFunction() // TODO

Console.__DefineOwnProperty__('log', logDesc)
