import type { Statement, CallExpression, ObjectExpression } from '@babel/types'
import type { WatchEffectInfo } from '../types'
import {
  getLocationFromNode,
  isFunctionLike,
  isIdentifier,
  parseParameters,
  processSetupFunction
} from './extractUtil'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

/**
 * 提取回调函数中使用的响应式变量（简单实现）
 * @param callback 回调函数节点
 * @returns 响应式变量名数组
 */
function extractReactiveVariables(callback: unknown): string[] {
  const variables: string[] = []

  if (!isFunctionLike(callback)) return variables

  // 简单实现：提取回调函数中使用的标识符
  // 注意：这只是一个简单的实现，实际的依赖追踪需要更复杂的分析
  function traverse(node: unknown) {
    if (!node || typeof node !== 'object') return

    const typedNode = node as {
      type?: string
      name?: string
      body?: unknown
      expression?: unknown
      arguments?: unknown[]
      callee?: unknown
      object?: unknown
      property?: unknown
    }

    // 提取标识符
    if (typedNode.type === 'Identifier' && typedNode.name) {
      variables.push(typedNode.name)
    }
    // 处理函数体
    else if (
      typedNode.type === 'BlockStatement' &&
      Array.isArray(typedNode.body)
    ) {
      for (const stmt of typedNode.body) {
        traverse(stmt)
      }
    }
    // 处理箭头函数表达式
    else if (typedNode.type === 'ArrowFunctionExpression') {
      traverse(typedNode.body)
    }
    // 处理调用表达式
    else if (typedNode.type === 'CallExpression') {
      if (typedNode.callee) traverse(typedNode.callee)
      if (typedNode.arguments) {
        for (const arg of typedNode.arguments) {
          traverse(arg)
        }
      }
    }
    // 处理成员表达式
    else if (typedNode.type === 'MemberExpression') {
      if (typedNode.object) traverse(typedNode.object)
      if (typedNode.property) traverse(typedNode.property)
    }
  }

  traverse(callback.body)
  return Array.from(new Set(variables)) // 去重
}

/**
 * 检查回调函数是否使用了 onCleanup
 * @param callback 回调函数节点
 * @returns 是否使用了 onCleanup
 */
function hasOnCleanup(callback: unknown): boolean {
  if (!isFunctionLike(callback)) return false

  // 检查回调函数参数是否包含 onCleanup
  for (const param of callback.params) {
    if (isIdentifier(param) && param.name === 'onCleanup') {
      return true
    }
  }

  return false
}

/**
 * 从 CallExpression 中提取 watchEffect 信息
 * @param callExpr 调用表达式节点
 * @returns WatchEffectInfo 对象或 null
 */
function extractWatchEffectFromCallExpression(
  callExpr: CallExpression
): WatchEffectInfo | null {
  // 检查是否是 watchEffect 函数调用
  if (
    callExpr.callee.type !== 'Identifier' ||
    callExpr.callee.name !== 'watchEffect'
  ) {
    return null
  }

  if (callExpr.arguments.length < 1) {
    return null
  }

  const callback = callExpr.arguments[0]
  let options: ObjectExpression | undefined

  // 检查是否有第二个参数（选项对象）
  if (
    callExpr.arguments.length > 1 &&
    callExpr.arguments[1].type === 'ObjectExpression'
  ) {
    options = callExpr.arguments[1]
  }

  // 提取回调函数参数
  const parameters = isFunctionLike(callback) ? parseParameters(callback) : []

  // 提取选项
  let flush: 'pre' | 'post' | 'sync' | undefined
  let onTrack: boolean = false
  let onTrigger: boolean = false

  if (options) {
    for (const prop of options.properties) {
      if (prop.type === 'ObjectProperty') {
        const key = prop.key

        if (key.type === 'Identifier') {
          if (key.name === 'flush' && prop.value.type === 'StringLiteral') {
            const flushValue = prop.value.value
            if (
              flushValue === 'pre' ||
              flushValue === 'post' ||
              flushValue === 'sync'
            ) {
              flush = flushValue
            }
          } else if (key.name === 'onTrack') {
            onTrack = true
          } else if (key.name === 'onTrigger') {
            onTrigger = true
          }
        }
      }
    }
  }

  // 提取回调函数中使用的响应式变量
  const reactiveVariables = extractReactiveVariables(callback)

  // 检查是否使用了 onCleanup
  const usesOnCleanup = hasOnCleanup(callback)

  return {
    name: 'watchEffect', // Composition API 中的 watchEffect 没有名称，使用默认值
    parameters,
    flush,
    onTrack,
    onTrigger,
    callbackType: 'function',
    position: getLocationFromNode(callExpr),
    reactiveVariables,
    usesOnCleanup
  }
}

/**
 * 从语句中提取 watchEffect 信息
 * @param stmt 语句节点
 * @returns WatchEffectInfo 数组
 */
function extractWatchEffectFromStatement(stmt: Statement): WatchEffectInfo[] {
  const watchEffects: WatchEffectInfo[] = []

  // 处理变量声明，如 const stop = watchEffect(...)
  if (stmt.type === 'VariableDeclaration') {
    for (const declarator of stmt.declarations) {
      if (declarator.init && declarator.init.type === 'CallExpression') {
        const watchEffectInfo = extractWatchEffectFromCallExpression(
          declarator.init
        )
        if (watchEffectInfo) {
          // 如果有变量名，使用变量名作为 watchEffect 的名称

          if (declarator.id.type === 'Identifier') {
            watchEffectInfo.name = declarator.id.name
          }
          watchEffects.push(watchEffectInfo)
        }
      }
    }
  }
  // 处理直接调用，如 watchEffect(...)
  else if (
    stmt.type === 'ExpressionStatement' &&
    stmt.expression.type === 'CallExpression'
  ) {
    const watchEffectInfo = extractWatchEffectFromCallExpression(
      stmt.expression
    )
    if (watchEffectInfo) {
      watchEffects.push(watchEffectInfo)
    }
  }

  return watchEffects
}

/**
 * 提取 Vue Composition API 中的 watchEffect 信息
 * @param ast AST 节点数组
 * @returns WatchEffectInfo 数组
 */
export function extractWatchEffect(ast: Statement[]): WatchEffectInfo[] {
  const watchEffects: WatchEffectInfo[] = []

  for (const stmt of ast) {
    // 提取直接在顶级作用域中的 watchEffect
    const extracted = extractWatchEffectFromStatement(stmt)
    watchEffects.push(...extracted)

    // 提取 setup 函数中的 watchEffect
    const setupWatchEffects = processSetupFunction(
      stmt,
      extractWatchEffectFromStatement
    )
    watchEffects.push(...setupWatchEffects)
  }

  logger.debug(`Extracted ${watchEffects.length} watchEffect expressions`)
  return watchEffects
}
