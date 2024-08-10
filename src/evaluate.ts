import type { Identifier, MemberExpression, Node, Program } from 'acorn'
import {
    type BinaryExpression,
    BinaryExpressionStr,
    type CallExpression,
    CallExpressionStr,
    type ExpressionStatement,
    ExpressionStatementStr,
    type FunctionDeclaration,
    FunctionDeclarationStr,
    IdentifierStr,
    type Literal,
    LiteralStr,
    MemberExpressionStr,
    ProgramStr,
    type VariableDeclaration,
    VariableDeclarationStr
} from './astNodeTypes'
import { Call, IsCallable, ToPrimitive, ToString } from './abstractOperations'
import type {
    GetThisValue,
    GetValue,
    IsPropertyReference,
    ParseNode,
    ReferenceRecord
} from './types'
import { empty } from './types'
import { $is, isReferenceRecord } from './util'
import { type DeclarativeEnvironmentRecord, ResolveBinding } from './env'
import type { ECMAScriptLanguageValue } from './global'
import type { ECMAScriptFunction } from './objects'

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
            return evaluate((node as ExpressionStatement).expression)

        case IdentifierStr:
            return evaluateIdentifier(node as Identifier)

        case LiteralStr:
            return evaluateLiteral(node as Literal)

        case FunctionDeclarationStr:
            return evaluateFunctionDeclaration(node as FunctionDeclaration)

        case MemberExpressionStr:
            return evaluateMemberExpression(node as MemberExpression)

        case BinaryExpressionStr:
            return evaluateBinaryExpression(node as BinaryExpression)

        case CallExpressionStr:
            return evaluateCallExpression(node as CallExpression)
    }
}

// TODO: var, let, const
function evaluateVariableDeclaration(node: VariableDeclaration) {
    // console.log(node)
    node.declarations.forEach((item) => {
        console.log(item)
    })
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

// https://tc39.es/ecma262/#sec-function-calls-runtime-semantics-evaluation
function evaluateCallExpression(expr: CallExpression) {
    const memberExpr = expr.callee
    const args = expr.arguments
    const ref = evaluate(memberExpr)
    const func = GetValue(ref)
    // eval
    const tailCall = IsInTailPosition(memberExpr)
    return EvaluateCall(func, ref, args, tailCall)
}

// TODO
function IsInTailPosition(expr: CallExpression) {
    return false
}

function EvaluateCall(
    func: ECMAScriptLanguageValue,
    ref: ECMAScriptLanguageValue | ReferenceRecord,
    args: Node[],
    tailPosition: boolean
) {
    let thisValue: any

    if (isReferenceRecord(ref)) {
        if (IsPropertyReference(ref)) {
            thisValue = GetThisValue(ref)
        } else {
            const refEnv = ref.__Base__
            thisValue = (refEnv as DeclarativeEnvironmentRecord).WithBaseObject()
        }
    } else {
        thisValue = undefined
    }
    const argList = ArgumentListEvaluation(args)

    if (!$is(func, 'object') || !IsCallable(func)) {
        // throw error
        console.log('type error')
        return
    }

    return Call(func, thisValue, argList)
}

function ArgumentListEvaluation(args: Node[]) {
    const list = []

    if (args.length === 0) {
        return list
    }

    args.forEach((arg) => {
        list.push(evaluate(arg))
    })

    return list
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

    return property.type === IdentifierStr
        ? EvaluatePropertyAccessWithIdentifierKey(baseValue, property, true)
        : EvaluatePropertyAccessWithExpressionKey(baseValue, property, true)
}

/**
 * MemberExpression . IdentifierName
 */
function EvaluatePropertyAccessWithIdentifierKey(
    baseValue: ECMAScriptLanguageValue,
    identifierName: Identifier,
    strict: boolean
) {
    const propertyNameString = identifierName.name
    const record = new ReferenceRecord()

    record.__Base__ = baseValue
    record.__ReferencedName__ = propertyNameString
    record.__Strict__ = strict
    record.__ThisValue__ = empty

    return record
}

/**
 * MemberExpression [ Expression ]
 */
function EvaluatePropertyAccessWithExpressionKey(
    baseValue: ECMAScriptLanguageValue,
    expression: Node,
    strict: boolean
) {
    const propertyNameReference = evaluate(expression)
    const propertyNameValue = GetValue(propertyNameReference)
    const record = new ReferenceRecord()

    record.__Base__ = baseValue
    record.__ReferencedName__ = propertyNameValue
    record.__Strict__ = strict
    record.__ThisValue__ = empty

    return record
}

export function EvaluateBody(
    functionBody: ParseNode,
    F: ECMAScriptFunction,
    argumentsList: ECMAScriptLanguageValue[]
) {
    console.log(functionBody)
}
