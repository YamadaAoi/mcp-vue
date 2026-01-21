import type {
  Statement,
  CallExpression,
  ArrowFunctionExpression,
  FunctionExpression,
  ObjectExpression,
  Identifier,
  ArrayExpression,
  MemberExpression,
  Expression,
  ArgumentPlaceholder,
  SpreadElement
} from '@babel/types'
import type { WatchInfo } from '../types'
import {
  getLocationFromNode,
  parseParameters,
  processSetupFunction
} from './extractUtil'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

/**
 * 检查节点是否为标识符
 */
function isIdentifier(node: unknown): node is Identifier {
  return !!(
    node &&
    typeof node === 'object' &&
    'type' in node &&
    node.type === 'Identifier' &&
    'name' in node
  )
}

/**
 * 检查节点是否为数组表达式
 */
function isArrayExpression(node: unknown): node is ArrayExpression {
  return !!(
    node &&
    typeof node === 'object' &&
    'type' in node &&
    node.type === 'ArrayExpression' &&
    'elements' in node
  )
}

/**
     
   
  
 * 检查节点是否为成员表达式
 */
function isMemberExpression(node: unknown): node is MemberExpression {
  return !!(
    node &&
    typeof node === 'object' &&
    'type' in node &&
    node.type === 'MemberExpression' &&
    'property' in node
  )
}

/**
 * 检查节点是否为函数表达式
 */
function isFunctionLike(
  node: unknown
): node is ArrowFunctionExpression | FunctionExpression {
  return !!(
    node &&
    typeof node === 'object' &&
    'type' in node &&
    (node.type === 'ArrowFunctionExpression' ||
      node.type === 'FunctionExpression') &&
    'params' in node
  )
}

/**
 * 从成员表达式中提取完整路径
 */
function extractMemberExpressionPath(expr: MemberExpression): string {
  if (isIdentifier(expr.property)) {
    if (isIdentifier(expr.object)) {
      return `${expr.object.name}.${expr.property.name}`
    } else if (isMemberExpression(expr.object)) {
      return `${extractMemberExpressionPath(expr.object)}.${expr.property.name}`
    }
  }
  return isIdentifier(expr.property) ? expr.property.name : ''
}

/**
 * 提取 watch 依赖项
 * @param expression 表达式节点
 * @returns 依赖项数组
 */
function extractWatchDependencies(
  expression: Expression | SpreadElement | ArgumentPlaceholder
): string[] {
  const dependencies: string[] = []

  // 处理标识符，如 watch(count, ...)
  if (isIdentifier(expression)) {
    dependencies.push(expression.name)
  }
  // 处理数组表达式，如 watch([count, message], ...)
  else if (isArrayExpression(expression)) {
    for (const element of expression.elements) {
      if (element) {
        // 递归处理数组中的每个元素
        const elementDeps = extractWatchDependencies(element as Expression)
        dependencies.push(...elementDeps)
      }
    }
  }
  // 处理成员表达式，如 watch(user.name, ...)
  else if (isMemberExpression(expression)) {
    const path = extractMemberExpressionPath(expression)
    if (path) {
      dependencies.push(path)
    }
  }
  // 处理函数表达式，如 watch(() => user.name, ...)
  else if (isFunctionLike(expression)) {
    // 函数形式的依赖项暂时无法静态分析，返回空数组
    // 可以在未来通过更复杂的 AST 分析来提取
  }

  return dependencies
}

/**
 * 提取 watch 回调函数的参数
 * @param callback 回调函数节点
 * @returns 参数数组
 */
function extractWatchCallbackParameters(callback: unknown): string[] {
  if (isFunctionLike(callback)) {
    return parseParameters(callback)
  }
  return []
}

/**
 * 从 CallExpression 中提取 watch 信息
 * @param callExpr 调用表达式节点
 * @returns WatchInfo 对象或 null
 */
function extractWatchFromCallExpression(
  callExpr: CallExpression
): WatchInfo | null {
  // 检查是否是 watch 函数调用
  if (
    callExpr.callee.type !== 'Identifier' ||
    callExpr.callee.name !== 'watch'
  ) {
    return null
  }

  if (callExpr.arguments.length < 2) {
    return null
  }

  const dependencyExpr = callExpr.arguments[0]
  const callback = callExpr.arguments[1]
  let options: ObjectExpression | undefined

  // 检查是否有第三个参数（选项对象）
  if (
    callExpr.arguments.length > 2 &&
    callExpr.arguments[2].type === 'ObjectExpression'
  ) {
    options = callExpr.arguments[2]
  }

  // 提取依赖项
  const dependencies = extractWatchDependencies(dependencyExpr)

  // 提取回调函数参数
  const parameters = extractWatchCallbackParameters(callback)

  // 提取选项
  let isDeep = false
  let isImmediate = false
  let flush: 'pre' | 'post' | 'sync' | undefined

  if (options) {
    for (const prop of options.properties) {
      if (prop.type === 'ObjectProperty') {
        const key = prop.key
        const value = prop.value

        if (key.type === 'Identifier') {
          if (key.name === 'deep' && value.type === 'BooleanLiteral') {
            isDeep = value.value
          } else if (
            key.name === 'immediate' &&
            value.type === 'BooleanLiteral'
          ) {
            isImmediate = value.value
          } else if (key.name === 'flush' && value.type === 'StringLiteral') {
            if (
              value.value === 'pre' ||
              value.value === 'post' ||
              value.value === 'sync'
            ) {
              flush = value.value
            }
          }
        }
      }
    }
  }

  // 检查是否是数组 watch
  const isArrayWatch = dependencyExpr.type === 'ArrayExpression'

  return {
    name: 'watch', // Composition API 中的 watch 没有名称，使用默认值
    dependencies,
    parameters,
    isDeep,
    isImmediate,
    flush,
    isArrayWatch,
    callbackType: 'function',
    position: getLocationFromNode(callExpr)
  }
}

/**
 * 从语句中提取 watch 信息
 * @param stmt 语句节点
 * @returns WatchInfo 数组
 */
function extractWatchFromStatement(stmt: Statement): WatchInfo[] {
  const watches: WatchInfo[] = []

  // 处理变量声明，如 const stopWatch = watch(...)
  if (stmt.type === 'VariableDeclaration') {
    for (const declarator of stmt.declarations) {
      if (declarator.init && declarator.init.type === 'CallExpression') {
        const watchInfo = extractWatchFromCallExpression(declarator.init)
        if (watchInfo) {
          // 如果有变量名，使用变量名作为 watch 的名称
          if (declarator.id.type === 'Identifier') {
            watchInfo.name = declarator.id.name
          }
          watches.push(watchInfo)
        }
      }
    }
  }
  // 处理直接调用，如 watch(...)
  else if (
    stmt.type === 'ExpressionStatement' &&
    stmt.expression.type === 'CallExpression'
  ) {
    const watchInfo = extractWatchFromCallExpression(stmt.expression)
    if (watchInfo) {
      watches.push(watchInfo)
    }
  }

  return watches
}

/**
 * 提取 Vue Composition API 中的 watch 信息
 * @param ast AST 节点数组
 * @returns WatchInfo 数组
 */
export function extractWatch(ast: Statement[]): WatchInfo[] {
  const watches: WatchInfo[] = []

  for (const stmt of ast) {
    // 提取直接在顶级作用域中的 watch
    const extracted = extractWatchFromStatement(stmt)
    watches.push(...extracted)

    // 提取 setup 函数中的 watch
    const setupWatches = processSetupFunction(stmt, extractWatchFromStatement)
    watches.push(...setupWatches)
  }

  logger.debug(`Extracted ${watches.length} watch expressions`)
  return watches
}
