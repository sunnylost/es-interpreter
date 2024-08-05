import * as acorn from 'acorn'
import * as walk from 'acorn-walk'
import { ParseNode } from './types'
import { Node } from 'acorn'
import {
    VariableDeclarationStr,
    VariableDeclaration,
    LexicallyDeclaration,
    VarDeclaration
} from './astNodeTypes'

// TODO: https://tc39.es/ecma262/#sec-static-semantics-boundnames
function parseVariableDeclaration(node: VariableDeclaration) {
    node.BoundNames = [node.declarations[0].id.name]
    node.IsConstantDeclaration = false
    return node
}

function parseLexicallyDeclaration(node: LexicallyDeclaration) {
    node.BoundNames = [node.declarations[0].id.name]

    node.IsConstantDeclaration = node.kind === 'const'

    return node
}

function isVariableDeclaration(node: Node): node is VarDeclaration {
    return node.type === VariableDeclarationStr
}

function IsLexicallyDeclaration(node: Node): node is LexicallyDeclaration {
    return isVariableDeclaration(node) && (node.kind === 'const' || node.kind === 'let')
}

function IsVarDeclaration(node: Node): node is VariableDeclaration {
    return isVariableDeclaration(node) && node.kind === 'var'
}

export function ParseText(sourceText, goalSymbol: 'script' | 'module'): ParseNode {
    const ast = acorn.parse(sourceText, {
        ecmaVersion: 'latest'
    })
    let retValue = {
        // TODO: only find let/const
        LexicallyDeclaredNames: [],
        LexicallyScopedDeclarations: [],
        // TODO: only find var
        VarDeclaredNames: [],
        VarScopedDeclarations: []
    }

    walk.simple(ast, {
        Program(node) {
            node?.body.filter(IsLexicallyDeclaration).forEach((_node) => {
                const node = parseLexicallyDeclaration(_node)
                retValue.LexicallyDeclaredNames.push(...node.BoundNames)
                retValue.LexicallyScopedDeclarations.push(node)
            })

            node?.body.filter(IsVarDeclaration).forEach((_node: VariableDeclaration) => {
                const node = parseVariableDeclaration(_node)
                retValue.VarDeclaredNames.push(...node.BoundNames)
                retValue.VarScopedDeclarations.push(node)
            })
        }
    })

    return retValue
}
