import type { Statement, VariableDeclarator } from '@babel/types'
import type { ComputedInfo } from '../types'
import {
  getLocationFromNode,
  extractVariableName,
  parseTypeAnnotation,
  processSetupFunction
} from './extractUtil'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

const COMPUTED_FUNCTION = 'computed'

/**
 * 从变量声明器中提取computed信息
 * @param declarator 变量声明器
 * @returns ComputedInfo或null
 */
function extractComputedFromDeclarator(
  declarator: VariableDeclarator
): ComputedInfo | null {
  const id = declarator.id
  const name = extractVariableName(id)

  if (!name) {
    return null
  }

  // 检查是否为computed函数调用
  if (
    !declarator.init ||
    declarator.init.type !== 'CallExpression' ||
    declarator.init.callee.type !== 'Identifier' ||
    declarator.init.callee.name !== COMPUTED_FUNCTION
  ) {
    return null
  }

  // 现在TypeScript知道declarator.init是CallExpression类型
  const callExpr = declarator.init
  let type: string | undefined = undefined
  let hasSetter = false

  // 提取类型信息
  if ('typeAnnotation' in id && id.typeAnnotation) {
    type = parseTypeAnnotation(id.typeAnnotation)
  }

  // 检查computed调用的参数
  if (callExpr.arguments.length > 0) {
    const arg = callExpr.arguments[0]

    // 如果参数是对象表达式，可能包含get和set方法
    if (arg.type === 'ObjectExpression') {
      // 检查是否有setter
      hasSetter = arg.properties.some(
        prop =>
          (prop.type === 'ObjectMethod' || prop.type === 'ObjectProperty') &&
          'key' in prop &&
          prop.key.type === 'Identifier' &&
          prop.key.name === 'set'
      )
    }
    // 函数表达式参数默认只有getter，无需额外处理
  }

  return {
    name,
    type,
    isReadonly: !hasSetter,
    hasSetter,
    position: getLocationFromNode(declarator)
  }
}

/**
 * 从语句中提取computed信息
 * @param stmt 语句
 * @returns ComputedInfo数组
 */
function extractComputedFromStatement(stmt: Statement): ComputedInfo[] {
  const computedInfo: ComputedInfo[] = []

  // 只处理变量声明语句
  if (stmt.type === 'VariableDeclaration') {
    computedInfo.push(
      ...stmt.declarations
        .map(extractComputedFromDeclarator)
        .filter((computed): computed is ComputedInfo => computed !== null)
    )
  }

  return computedInfo
}

/**
 * 从AST中提取computed信息
 * @param ast 语句数组
 * @returns ComputedInfo数组
 */
export function extractComputed(ast: Statement[]): ComputedInfo[] {
  const computedInfo: ComputedInfo[] = []

  for (const stmt of ast) {
    // 从顶层语句中提取
    computedInfo.push(...extractComputedFromStatement(stmt))

    // 从setup函数中提取

    computedInfo.push(
      ...processSetupFunction(stmt, extractComputedFromStatement)
    )
  }

  logger.debug(`Extracted ${computedInfo.length} computed properties`)
  return computedInfo
}
