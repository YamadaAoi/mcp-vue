import type {
  Statement,
  CallExpression,
  Expression,
  ArgumentPlaceholder,
  SpreadElement
} from '@babel/types'
import type { ProvideInfo, InjectInfo } from '../types'
import {
  getLocationFromNode,
  isIdentifier,
  isStringLiteral,
  processSetupFunction
} from './extractUtil'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

/**
 * 从表达式中提取键信息
 * @param expr 表达式节点
 * @returns 包含键和是否为Symbol键的对象
 */
function extractKeyFromExpression(
  expr: Expression | SpreadElement | ArgumentPlaceholder
): {
  key: string | undefined
  isSymbolKey: boolean
} {
  let key: string | undefined
  let isSymbolKey = false

  if (isStringLiteral(expr)) {
    key = expr.value
  } else if (isIdentifier(expr)) {
    key = expr.name
    // 检查是否是 Symbol
    if (key === 'Symbol' || key.startsWith('Symbol.')) {
      isSymbolKey = true
    }
  } else if (
    expr.type === 'CallExpression' &&
    expr.callee.type === 'Identifier' &&
    expr.callee.name === 'Symbol'
  ) {
    // 处理 Symbol('key') 形式
    isSymbolKey = true
    if (expr.arguments.length > 0 && isStringLiteral(expr.arguments[0])) {
      key = expr.arguments[0].value
    }
  }

  return { key, isSymbolKey }
}

/**
 * 提取表达式的值（简单实现）
 * @param expr 表达式节点
 * @returns 表达式的值或 undefined
 */
function extractExpressionValue(expr: unknown): unknown {
  if (!expr || typeof expr !== 'object') return undefined

  const typedExpr = expr as {
    type?: string
    value?: unknown
    elements?: unknown[]
    properties?: unknown[]
    key?: unknown
  }

  switch (typedExpr.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
    case 'UndefinedLiteral':
      return typedExpr.value
    case 'ArrayExpression':
      return typedExpr.elements
        ? typedExpr.elements.map(item => {
            // 避免深层递归，只处理一层数组
            if (item && typeof item === 'object' && 'type' in item) {
              const itemTyped = item as { type?: string; value?: unknown }
              if (
                [
                  'StringLiteral',
                  'NumericLiteral',
                  'BooleanLiteral',
                  'NullLiteral',
                  'UndefinedLiteral'
                ].includes(itemTyped.type || '')
              ) {
                return itemTyped.value
              }
            }
            return undefined
          })
        : []
    case 'ObjectExpression':
      if (!typedExpr.properties) return {}
      const obj: Record<string, unknown> = {}
      for (const prop of typedExpr.properties) {
        if (
          typeof prop === 'object' &&
          prop &&
          'key' in prop &&
          'value' in prop
        ) {
          const keyProp = prop.key
          let key: string | undefined
          if (isIdentifier(keyProp)) {
            key = keyProp.name
          } else if (isStringLiteral(keyProp)) {
            key = keyProp.value
          }
          if (key) {
            // 避免深层递归，只处理一层对象
            const propValue = prop.value
            if (
              propValue &&
              typeof propValue === 'object' &&
              'type' in propValue
            ) {
              const valueTyped = propValue as { type?: string; value?: unknown }
              if (
                [
                  'StringLiteral',
                  'NumericLiteral',
                  'BooleanLiteral',
                  'NullLiteral',
                  'UndefinedLiteral'
                ].includes(valueTyped.type || '')
              ) {
                obj[key] = valueTyped.value
              } else {
                obj[key] = undefined
              }
            } else {
              obj[key] = undefined
            }
          }
        }
      }
      return obj
    default:
      return undefined
  }
}

/**
 * 从 CallExpression 中提取 provide 信息
 * @param callExpr 调用表达式节点
 * @returns ProvideInfo 对象或 null
 */
function extractProvideFromCallExpression(
  callExpr: CallExpression
): ProvideInfo | null {
  // 检查是否是 provide 函数调用
  if (
    callExpr.callee.type !== 'Identifier' ||
    callExpr.callee.name !== 'provide'
  ) {
    return null
  }

  if (callExpr.arguments.length < 2) {
    return null
  }

  const keyArg = callExpr.arguments[0]
  const valueArg = callExpr.arguments[1]

  // 提取 key
  const { key, isSymbolKey } = extractKeyFromExpression(keyArg)

  if (!key) {
    return null
  }

  // 提取 value
  const value = extractExpressionValue(valueArg)

  // 检查是否是响应式的
  const isReactive =
    valueArg.type === 'CallExpression' &&
    valueArg.callee.type === 'Identifier' &&
    (valueArg.callee.name === 'ref' || valueArg.callee.name === 'reactive')

  return {
    key,
    value,
    isSymbolKey,
    isReactive,
    position: getLocationFromNode(callExpr)
  }
}

/**
 * 从 CallExpression 中提取 inject 信息
 * @param callExpr 调用表达式节点
 * @returns InjectInfo 对象或 null
 */
function extractInjectFromCallExpression(
  callExpr: CallExpression
): InjectInfo | null {
  // 检查是否是 inject 函数调用
  if (
    callExpr.callee.type !== 'Identifier' ||
    callExpr.callee.name !== 'inject'
  ) {
    return null
  }

  if (callExpr.arguments.length < 1) {
    return null
  }

  const keyArg = callExpr.arguments[0]
  let defaultValue: unknown = undefined

  // 提取 key
  const { key, isSymbolKey } = extractKeyFromExpression(keyArg)

  if (!key) {
    return null
  }

  // 提取默认值（如果有）
  if (callExpr.arguments.length > 1) {
    defaultValue = extractExpressionValue(callExpr.arguments[1])
  }

  return {
    key,
    default: defaultValue,
    isSymbolKey,
    isReactive: false, // inject 的值是否响应式取决于 provide 的值
    position: getLocationFromNode(callExpr)
  }
}

/**
 * 从语句中提取 provide 信息
 * @param stmt 语句节点
 * @returns ProvideInfo 数组
 */
function extractProvideFromStatement(stmt: Statement): ProvideInfo[] {
  const provides: ProvideInfo[] = []

  // 处理变量声明，如 const foo = provide(...)
  if (stmt.type === 'VariableDeclaration') {
    for (const declarator of stmt.declarations) {
      if (declarator.init && declarator.init.type === 'CallExpression') {
        const provideInfo = extractProvideFromCallExpression(declarator.init)
        if (provideInfo) {
          provides.push(provideInfo)
        }
      }
    }
  }
  // 处理直接调用，如 provide(...)
  else if (
    stmt.type === 'ExpressionStatement' &&
    stmt.expression.type === 'CallExpression'
  ) {
    const provideInfo = extractProvideFromCallExpression(stmt.expression)
    if (provideInfo) {
      provides.push(provideInfo)
    }
  }

  return provides
}

/**
 * 从语句中提取 inject 信息
 * @param stmt 语句节点
 * @returns InjectInfo 数组
 */
function extractInjectFromStatement(stmt: Statement): InjectInfo[] {
  const injects: InjectInfo[] = []

  // 处理变量声明，如 const foo = inject(...)
  if (stmt.type === 'VariableDeclaration') {
    for (const declarator of stmt.declarations) {
      if (declarator.init && declarator.init.type === 'CallExpression') {
        const injectInfo = extractInjectFromCallExpression(declarator.init)
        if (injectInfo) {
          // 如果有变量名，使用变量名作为别名
          if (declarator.id.type === 'Identifier') {
            injectInfo.alias = declarator.id.name
          }
          injects.push(injectInfo)
        }
      }
    }
  }
  // 处理直接调用，如 inject(...)
  else if (
    stmt.type === 'ExpressionStatement' &&
    stmt.expression.type === 'CallExpression'
  ) {
    const injectInfo = extractInjectFromCallExpression(stmt.expression)
    if (injectInfo) {
      injects.push(injectInfo)
    }
  }

  return injects
}

/**
 * 通用的提取函数
 * @param ast AST 节点数组
 * @param extractor 从语句中提取信息的函数
 * @param type 提取的类型
 * @returns 提取的信息数组
 */
function extractFromAst<T>(
  ast: Statement[],
  extractor: (stmt: Statement) => T[],
  type: 'provide' | 'inject'
): T[] {
  const results: T[] = []

  for (const stmt of ast) {
    // 提取直接在顶级作用域中的信息
    const extracted = extractor(stmt)
    results.push(...extracted)

    // 提取 setup 函数中的信息
    const setupResults = processSetupFunction(stmt, extractor)
    results.push(...setupResults)
  }

  logger.debug(`Extracted ${results.length} ${type} entries`)
  return results
}

/**
 * 提取 Vue Composition API 中的 provide 信息
 * @param ast AST 节点数组
 * @returns ProvideInfo 数组
 */
export function extractProvide(ast: Statement[]): ProvideInfo[] {
  return extractFromAst(ast, extractProvideFromStatement, 'provide')
}

/**
 * 提取 Vue Composition API 中的 inject 信息
 * @param ast AST 节点数组
 * @returns InjectInfo 数组
 */
export function extractInject(ast: Statement[]): InjectInfo[] {
  return extractFromAst(ast, extractInjectFromStatement, 'inject')
}
