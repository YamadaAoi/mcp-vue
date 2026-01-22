import type {
  Statement,
  ObjectMethod,
  ObjectProperty,
  ObjectExpression
} from '@babel/types'
import type { ComputedPropertyInfo } from '../types'
import { getLocationFromNode } from './extractUtil'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

/**
 * 从对象方法中提取computed属性信息
 * @param method 对象方法节点
 * @param name 属性名
 * @returns ComputedPropertyInfo
 */
function extractComputedFromObjectMethod(
  method: ObjectMethod,
  name: string
): ComputedPropertyInfo {
  return {
    name,
    isGetter: method.kind === 'get' || method.kind === 'method',
    isSetter: method.kind === 'set',
    position: getLocationFromNode(method)
  }
}

/**
 * 从对象属性中提取computed属性信息
 * @param property 对象属性节点
 * @param name 属性名
 * @returns ComputedPropertyInfo或null
 */
function extractComputedFromObjectProperty(
  property: ObjectProperty,
  name: string
): ComputedPropertyInfo | null {
  const value = property.value
  const position = getLocationFromNode(property)

  // 检查是否为函数表达式或箭头函数
  if (
    value.type === 'FunctionExpression' ||
    value.type === 'ArrowFunctionExpression'
  ) {
    return {
      name,
      isGetter: true,
      isSetter: false,
      position
    }
  }

  // 检查是否为对象表达式（包含get和set方法）
  if (value.type === 'ObjectExpression') {
    const hasGetter = value.properties.some(
      prop =>
        (prop.type === 'ObjectMethod' || prop.type === 'ObjectProperty') &&
        'key' in prop &&
        prop.key.type === 'Identifier' &&
        prop.key.name === 'get'
    )

    const hasSetter = value.properties.some(
      prop =>
        (prop.type === 'ObjectMethod' || prop.type === 'ObjectProperty') &&
        'key' in prop &&
        prop.key.type === 'Identifier' &&
        prop.key.name === 'set'
    )

    return {
      name,
      isGetter: hasGetter,
      isSetter: hasSetter,
      position
    }
  }

  return null
}

/**
 * 处理computed对象的属性
 * @param properties 对象属性数组
 * @returns ComputedPropertyInfo数组
 */
function processComputedProperties(
  properties: (ObjectMethod | ObjectProperty)[]
): ComputedPropertyInfo[] {
  return properties
    .map(prop => {
      // 获取属性名
      let name: string | null = null
      if (prop.key.type === 'Identifier') {
        name = prop.key.name
      } else if (prop.key.type === 'StringLiteral') {
        name = prop.key.value
      }

      if (!name) {
        return null
      }

      // 根据属性类型提取信息
      if (prop.type === 'ObjectMethod') {
        return extractComputedFromObjectMethod(prop, name)
      } else if (prop.type === 'ObjectProperty') {
        return extractComputedFromObjectProperty(prop, name)
      }

      return null
    })
    .filter(
      (computedProp): computedProp is ComputedPropertyInfo =>
        computedProp !== null
    )
}

/**
 * 从组件选项对象中提取computed属性信息
 * @param options 组件选项对象表达式
 * @returns ComputedPropertyInfo数组
 */
function extractComputedFromComponentOptions(
  options: ObjectExpression
): ComputedPropertyInfo[] {
  const computedProperties: ComputedPropertyInfo[] = []

  // 查找computed属性
  for (const prop of options.properties) {
    if (
      (prop.type === 'ObjectMethod' || prop.type === 'ObjectProperty') &&
      'key' in prop &&
      prop.key.type === 'Identifier' &&
      prop.key.name === 'computed'
    ) {
      // 检查computed属性的值是否为对象表达式
      if (
        prop.type === 'ObjectProperty' &&
        prop.value.type === 'ObjectExpression'
      ) {
        const computedProps = processComputedProperties(
          prop.value.properties as (ObjectMethod | ObjectProperty)[]
        )
        computedProperties.push(...computedProps)
      }
    }
  }

  return computedProperties
}

/**
 * 从语句中提取computed属性信息
 * @param stmt 语句
 * @returns ComputedPropertyInfo数组
 */
function extractComputedFromStatement(stmt: Statement): ComputedPropertyInfo[] {
  const computedProperties: ComputedPropertyInfo[] = []

  // 处理默认导出声明
  if (stmt.type === 'ExportDefaultDeclaration') {
    const declaration = stmt.declaration

    // 处理defineComponent调用
    if (
      declaration.type === 'CallExpression' &&
      declaration.callee.type === 'Identifier' &&
      declaration.callee.name === 'defineComponent'
    ) {
      // 检查第一个参数是否为对象表达式
      if (
        declaration.arguments.length > 0 &&
        declaration.arguments[0].type === 'ObjectExpression'
      ) {
        const options = declaration.arguments[0]
        const computedProps = extractComputedFromComponentOptions(options)
        computedProperties.push(...computedProps)
      }
    }
    // 处理直接的对象表达式导出
    else if (declaration.type === 'ObjectExpression') {
      const computedProps = extractComputedFromComponentOptions(declaration)
      computedProperties.push(...computedProps)
    }
  }

  return computedProperties
}

/**
 * 从AST中提取computed属性信息
 * @param ast 语句数组
 * @returns ComputedPropertyInfo数组
 */
export function extractComputedProperties(
  ast: Statement[]
): ComputedPropertyInfo[] {
  const computedProperties: ComputedPropertyInfo[] = []

  for (const stmt of ast) {
    const extractedProps = extractComputedFromStatement(stmt)
    computedProperties.push(...extractedProps)
  }

  logger.debug(`Extracted ${computedProperties.length} computed properties`)
  return computedProperties
}
