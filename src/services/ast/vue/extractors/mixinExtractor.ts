import type {
  Statement,
  ObjectExpression,
  Property,
  CallExpression,
  Expression,
  SpreadElement
} from '@babel/types'
import type { MixinInfo } from '../types'
import { getLocationFromNode } from './extractUtil'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

/**
 * 从 Mixin 引用节点中提取 Mixin 信息
 * @param mixinNode Mixin 引用节点
 * @returns Mixin 信息对象，如果无法提取则返回 null
 */
function extractMixinInfoFromNode(
  mixinNode: Expression | SpreadElement | null
): MixinInfo | null {
  if (!mixinNode) return null

  let mixinName = ''
  let source: string | undefined = undefined

  // 处理标识符形式的 Mixin 引用 (e.g., MyMixin)
  if (mixinNode.type === 'Identifier') {
    mixinName = mixinNode.name
  }
  // 处理字符串字面量形式的 Mixin 引用 (e.g., './MyMixin')
  else if (mixinNode.type === 'StringLiteral') {
    mixinName = mixinNode.value
    source = mixinNode.value
  }
  // 处理 require 调用形式的 Mixin 引用 (e.g., require('./MyMixin'))
  else if (
    mixinNode.type === 'CallExpression' &&
    mixinNode.callee.type === 'Identifier' &&
    mixinNode.callee.name === 'require' &&
    mixinNode.arguments.length > 0 &&
    mixinNode.arguments[0].type === 'StringLiteral'
  ) {
    mixinName = mixinNode.arguments[0].value
    source = mixinNode.arguments[0].value
  }

  if (mixinName) {
    return {
      name: mixinName,
      source,
      position: getLocationFromNode(mixinNode)
    }
  }

  return null
}

/**对象属性中提取 Mixin 信息 param property 对象属性节点 @returns Mixin 信息数组
 */
function extractMixinFromProperty(property: Property): MixinInfo[] {
  // 检查是否是 mixins 属性
  if (property.key.type !== 'Identifier' || property.key.name !== 'mixins') {
    return []
  }

  // 检查是否是数组表达式
  if (!property.value || property.value.type !== 'ArrayExpression') {
    return []
  }

  const arrayExpression = property.value
  const extractedMixins: MixinInfo[] = []

  // 处理数组中的每个元素
  for (const mixinNode of arrayExpression.elements) {
    const mixinInfo = extractMixinInfoFromNode(mixinNode)
    if (mixinInfo) {
      extractedMixins.push(mixinInfo)
    }
  }

  return extractedMixins
}

/**
 * 从对象表达式中提取 Mixin 信息
 * @param objExpr 对象表达式节点
 * @returns Mixin 信息数组
 */
function extractMixinsFromObjectExpression(
  objExpr: ObjectExpression
): MixinInfo[] {
  const extractedMixins: MixinInfo[] = []

  for (const property of objExpr.properties) {
    // 使用类型断言确保类型安全性
    if (property.type === 'ObjectProperty') {
      const propertyMixins = extractMixinFromProperty(property)
      extractedMixins.push(...propertyMixins)
    }
  }

  return extractedMixins
}

/**
 * 处理 defineComponent 函数调用，提取其中的 Mixin 信息
 * @param callExpr 函数调用表达式节点
 * @returns Mixin 信息数组
 */
function handleDefineComponentCall(callExpr: CallExpression): MixinInfo[] {
  const extractedMixins: MixinInfo[] = []

  // 检查是否是 defineComponent 调用
  if (
    callExpr.callee.type === 'Identifier' &&
    callExpr.callee.name === 'defineComponent' &&
    callExpr.arguments.length > 0
  ) {
    const arg = callExpr.arguments[0]
    // 检查第一个参数是否是对象表达式
    if (arg.type === 'ObjectExpression') {
      const componentMixins = extractMixinsFromObjectExpression(arg)
      extractedMixins.push(...componentMixins)
    }
  }

  return extractedMixins
}

/**
 * 从语句中提取 Mixin 信息
 * @param stmt 语句节点
 * @returns Mixin 信息数组
            
          
 */
function extractMixinsFromStatement(stmt: Statement): MixinInfo[] {
  const extractedMixins: MixinInfo[] = []

  // 处理变量声明

  if (stmt.type === 'VariableDeclaration') {
    for (const declarator of stmt.declarations) {
      if (declarator.init) {
        // 处理对象表达式 (e.g., const MyComponent = { mixins: [...] })
        if (declarator.init.type === 'ObjectExpression') {
          const objectMixins = extractMixinsFromObjectExpression(
            declarator.init
          )
          extractedMixins.push(...objectMixins)
        }
        // 处理 defineComponent 调用 (e.g., const MyComponent = defineComponent({ mixins: [...] }))
        else if (declarator.init.type === 'CallExpression') {
          const defineComponentMixins = handleDefineComponentCall(
            declarator.init
          )
          extractedMixins.push(...defineComponentMixins)
        }
      }
    }
  }
  // 处理 export default 语句
  else if (stmt.type === 'ExportDefaultDeclaration') {
    const declaration = stmt.declaration
    if (declaration) {
      // 处理对象表达式 (e.g., export default { mixins: [...] })
      if (declaration.type === 'ObjectExpression') {
        const objectMixins = extractMixinsFromObjectExpression(declaration)
        extractedMixins.push(...objectMixins)
      }
      // 处理 defineComponent 调用 (e.g., export default defineComponent({ mixins: [...] }))
      else if (declaration.type === 'CallExpression') {
        const defineComponentMixins = handleDefineComponentCall(declaration)
        extractedMixins.push(...defineComponentMixins)
      }
    }
  }
  // 处理函数声明
  else if (stmt.type === 'FunctionDeclaration') {
    if (stmt.body.type === 'BlockStatement' && Array.isArray(stmt.body.body)) {
      for (const bodyStmt of stmt.body.body) {
        const nestedMixins = extractMixinsFromStatement(bodyStmt)
        extractedMixins.push(...nestedMixins)
      }
    }
  }
  // 处理表达式语句 (可能包含 defineComponent 调用)
  else if (
    stmt.type === 'ExpressionStatement' &&
    stmt.expression.type === 'CallExpression'
  ) {
    const defineComponentMixins = handleDefineComponentCall(stmt.expression)
    extractedMixins.push(...defineComponentMixins)
  }

  return extractedMixins
}

/**
 * 从 AST 中提取 Mixin 信息
 * @param ast AST 语句数组
 * @returns Mixin 信息数组
 */
export function extractMixins(ast: Statement[]): MixinInfo[] {
  const allMixins: MixinInfo[] = []

  for (const stmt of ast) {
    const statementMixins = extractMixinsFromStatement(stmt)
    if (statementMixins.length > 0) {
      allMixins.push(...statementMixins)
    }
  }

  logger.debug(`Extracted ${allMixins.length} mixins`)
  return allMixins
}
