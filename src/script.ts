import { InitializeHostDefinedRealm, RealmRecord } from './realm'
import { ModuleRecord } from './module'
import { ExecutionContext, GlobalEnvironmentRecord } from './env'
import { surroundingAgent } from './agent'
import { ParseNode, unused } from './types'
import { ParseText } from './parse'
import { VariableDeclarationStr } from './astNodeTypes'

// Initialize
InitializeHostDefinedRealm()

export class ScriptRecord {
    __Realm__: RealmRecord = undefined
    __ECMAScriptCode__: ParseNode
    __LoadedModules__: {
        __Specifier__: string
        __Module__: ModuleRecord
    }[]
    __HostDefined__: null
}

export function ParseScript(sourceText: string, realm: RealmRecord) {
    let script = ParseText(sourceText, 'script')
    const scriptRecord = new ScriptRecord()
    scriptRecord.__Realm__ = realm
    scriptRecord.__ECMAScriptCode__ = script
    return scriptRecord
}

// https://tc39.es/ecma262/#sec-runtime-semantics-scriptevaluation
export function ScriptEvaluation(scriptRecord: ScriptRecord) {
    const globalEnv = scriptRecord.__Realm__.__GlobalEnv__
    const scriptContext = new ExecutionContext()
    scriptContext.Function = null
    scriptContext.Realm = scriptRecord.__Realm__
    scriptContext.ScriptOrModule = scriptRecord
    scriptContext.VariableEnvironment = globalEnv
    scriptContext.LexicalEnvironment = globalEnv
    scriptContext.PrivateEnvironment = null
    // TODO: suspend running execution context
    surroundingAgent.executionContextStack.push(scriptContext)
    surroundingAgent.runningExecutionContext = scriptContext
    const script = scriptRecord.__ECMAScriptCode__
    const result = GlobalDeclarationInstantiation(script, globalEnv)

    surroundingAgent.executionContextStack.pop()
    surroundingAgent.runningExecutionContext =
        surroundingAgent.executionContextStack[
            surroundingAgent.executionContextStack.length - 1
        ]

    return result
}

// TODO: https://tc39.es/ecma262/#sec-globaldeclarationinstantiation
function GlobalDeclarationInstantiation(
    script: ParseNode,
    env: GlobalEnvironmentRecord
) {
    const lexNames = script.LexicallyDeclaredNames
    const varNames = script.VarDeclaredNames

    for (let name of lexNames) {
        if (env.HasVarDeclaration(name)) {
            // syntaxError
            return
        }

        if (env.HasLexicalDeclaration(name)) {
            // TODO: error
            return
        }

        const hasRestrictedGlobal = env.HasRestrictedGlobalProperty(name)

        if (hasRestrictedGlobal) {
            // TODO: error
            return
        }
    }

    for (let name of varNames) {
        if (env.HasLexicalDeclaration(name)) {
            // TODO: syntaxError
            return
        }
    }

    const varDeclarations = script.VarScopedDeclarations
    const functionsToInitialize = []
    const declaredFunctionNames = []
    debugger
    // reverse order
    for (let d of [...varDeclarations].reverse()) {
        // d is not either a VariableDeclaration, a ForBinding, or a BindingIdentifier
        if (d.type !== VariableDeclarationStr) {
            const fn = d.BoundNames[0]

            if (!declaredFunctionNames.includes(fn)) {
                const fnDefinable = env.CanDeclareGlobalFunction(fn)

                if (!fnDefinable) {
                    // throw
                }

                declaredFunctionNames.push(fn)
                functionsToInitialize.unshift(d)
            }
        }
    }

    const declaredVarNames = []

    for (let d of varDeclarations) {
        // a. If d is either a VariableDeclaration, a ForBinding, or a BindingIdentifier, then
        if (d.type === VariableDeclarationStr) {
            for (let vn of d.BoundNames) {
                if (!declaredFunctionNames.includes(vn)) {
                    const vnDefinable = env.CanDeclareGlobalVar(vn)

                    if (!vnDefinable) {
                        // throw
                    }

                    if (!declaredVarNames.includes(vn)) {
                        declaredVarNames.push(vn)
                    }
                }
            }
        }
    }

    const lexDeclarations = script.LexicallyScopedDeclarations
    const privateEnv = null

    for (let d of lexDeclarations) {
        for (let dn of d.BoundNames) {
            if (d.IsConstantDeclaration) {
                env.CreateImmutableBinding(dn, true)
            } else {
                env.CreateMutableBinding(dn, false)
            }
        }
    }

    for (let f of functionsToInitialize) {
        const fn = f.BoundNames[0]
        const fo = InstantiateFunctionObject(env, privateEnv)
        env.CreateGlobalFunctionBinding(fn, fo, false)
    }

    for (let vn of declaredVarNames) {
        env.CreateGlobalVarBinding(vn, false)
    }
    return unused
}
