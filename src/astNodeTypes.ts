import { Node } from 'acorn'

export const BlockStatementStr = 'BlockStatement'
export const VariableDeclarationStr = 'VariableDeclaration'
export const FunctionDeclarationStr = 'FunctionDeclaration'
export const ExpressionStatementStr = 'ExpressionStatement'

export const BinaryExpressionStr = 'BinaryExpression'
export const CallExpressionStr = 'CallExpression'

export const LiteralStr = 'Literal'

export const IdentifierStr = 'Identifier'
interface Identifier extends Node {
    type: typeof IdentifierStr
    name: string // TODO
}

export interface VarDeclaration extends Node {
    type: typeof VariableDeclarationStr
    declarations: VariableDeclarator[]
    kind: 'const' | 'let' | 'var'
    BoundNames: string[]
    IsConstantDeclaration: boolean
}

export interface LetDeclaration extends VarDeclaration {
    kind: 'let'
}

export interface ConstDeclaration extends VarDeclaration {
    kind: 'const'
}

export interface VariableDeclaration extends VarDeclaration {
    kind: 'var'
}

export type LexicallyDeclaration = LetDeclaration | ConstDeclaration

export interface VariableDeclarator extends Node {
    type: 'VariableDeclarator'
    id: Identifier
    init: Node | null
}

export interface ExpressionStatement extends Node {
    type: typeof ExpressionStatementStr
    expression: Expression // TODO
}

export interface Expression extends Node {
    type: string
}

export interface BlockStatement extends Node {
    type: typeof BlockStatementStr
    body: Node[]
}

export interface BinaryExpression extends Node {
    type: typeof BinaryExpressionStr
    left: any
    right: any
    operator: '+' | '-'
}

export interface Literal extends Node {
    type: typeof LiteralStr
    raw: string
    value: any
}

export interface FunctionDeclaration extends Node {
    type: typeof FunctionDeclarationStr
    async: boolean
    expression: boolean
    generator: boolean
    id: Identifier
    body: BlockStatement
    params: any[]
}

export interface CallExpression extends Node {
    type: typeof CallExpressionStr
    callee
    arguments: any[] // TODO
    optional: boolean // TODO: ??
}
