import { Identifier, MemberExpression, Node, Program } from 'acorn'
import {
    BinaryExpression,
    BinaryExpressionStr,
    CallExpression,
    CallExpressionStr,
    Expression,
    ExpressionStatement,
    ExpressionStatementStr,
    FunctionDeclaration,
    FunctionDeclarationStr,
    IdentifierStr,
    Literal,
    LiteralStr,
    MemberExpressionStr,
    ProgramStr,
    VariableDeclaration,
    VariableDeclarationStr
} from './astNodeTypes'
import { ToPrimitive, ToString } from './abstractOperations'
import { GetValue } from './types'
import { surroundingAgent } from './agent'
import { $is } from './util'
import { ResolveBinding } from './env'

export function evaluate(node: Node) {
    console.log(node)
    switch (node.type) {
        case ProgramStr:
            ;(node as Program).body.forEach((n) => evaluate(n))
            break

        case VariableDeclarationStr:
            evaluateVariableDeclaration(node as VariableDeclaration)
            break

        case ExpressionStatementStr:
            return evaluateExpression((node as ExpressionStatement).expression)

        case IdentifierStr:
            return evaluateIdentifier(node as Identifier)

        case LiteralStr:
            return evaluateLiteral(node as Literal)

        case FunctionDeclarationStr:
            return evaluateFunctionDeclaration(node as FunctionDeclaration)

        case MemberExpressionStr:
            return evaluateMemberExpression(node as MemberExpression)
    }
}

// TODO: var, let, const
function evaluateVariableDeclaration(node: VariableDeclaration) {
    // console.log(node)
    node.declarations.forEach((item) => {
        console.log(item)
    })
}

function evaluateExpression(expr: Expression) {
    console.log('expression', expr, surroundingAgent)

    switch (expr.type) {
        case BinaryExpressionStr:
            return evaluateBinaryExpression(expr as BinaryExpression)

        case CallExpressionStr:
            return evaluateCallExpression(expr as CallExpression)
    }
}

// https://tc39.es/ecma262/#sec-evaluatestringornumericbinaryexpression
function EvaluateStringOrNumericBinaryExpression(leftOperand, opText: string, rightOperand) {
    const lref = evaluate(leftOperand)
    const lval = GetValue(lref)
    const rref = evaluate(rightOperand) // TODO
    const rval = GetValue(rref)
    return ApplyStringOrNumericBinaryOperator(lval, opText, rval)
}

// https://tc39.es/ecma262/#sec-applystringornumericbinaryoperator
function ApplyStringOrNumericBinaryOperator(lval, opText, rval) {
    if (opText === '+') {
        const lprim = ToPrimitive(lval)
        const rprim = ToPrimitive(rval)
        // TODO: is this right?
        if ($is(lprim, 'string') || $is(rprim, 'string')) {
            const lstr = ToString(lprim)
            const rstr = ToString(rprim)

            // https://tc39.es/ecma262/#string-concatenation
            return `${lstr}${rstr}`
        }
        // SKIP
        return lprim + rprim
    }
}
function evaluateBinaryExpression(expr: BinaryExpression) {
    console.log('binary', expr)
    // TODO: evaluate
    return EvaluateStringOrNumericBinaryExpression(expr.left, expr.operator, expr.right)
}

function evaluateFunctionDeclaration(node: FunctionDeclaration) {
    const name = node.id ? node.id.name : 'default'
    const sourceText = node.body
    const F = OrdinaryFunctionCreate(
        '%Function.prototype%',
        sourceText,
        node.params,
        non - lexical - this,
        env,
        privateEnv
    )
    SetFunctionName(F, name)
    MakeConstructor(F)
    return F
}

function evaluateCallExpression(expr: CallExpression) {
    const memberExpr = expr.callee
    const args = expr.arguments
    const ref = evaluate(memberExpr)
    const func = GetValue(ref)
    // eval
    const thisCall = expr
    const tailCall = IsInTailPosition(thisCall)
    return EvaluateCall(func, ref, args, tailCall)
}

function evaluateIdentifier(id: Identifier) {
    return ResolveBinding(id.name)
}

function evaluateLiteral(literal: Literal) {
    return {
        $type: typeof literal.value,
        PrimitiveValue: literal.value // TODO
    }
}

function evaluateMemberExpression(member: MemberExpression) {
    const { property, object } = member
    const baseReference = evaluate(object)
    const baseValue = GetValue(baseReference)

    return EvaluatePropertyAccessWithExpressionKey(baseValue, property, true)
}
