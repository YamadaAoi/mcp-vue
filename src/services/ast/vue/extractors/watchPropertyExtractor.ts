import type {
  ObjectMethod,
  ObjectProperty,
  Statement,
  ObjectExpression
} from '@babel/types'
import type { WatchPropertyInfo } from '../types'
import { getLocationFromNode, parseParameters } from './extractUtil'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

/**
 * 提取属性名
 * @param key 节点的key属性
 * @returns 属性名字符串或null
 */
function extractPropertyName(key: unknown): string | null {
  if (!key || typeof key !== 'object') return null

  const typedKey = key as { type?: string; name?: string; value?: string }

  if (typedKey.type === 'Identifier' && typeof typedKey.name === 'string') {
    return typedKey.name
  } else if (
    typedKey.type === 'StringLiteral' &&
    typeof typedKey.value === 'string'
  ) {
    return typedKey.value
  }

  return null
}

/**
 * 从ObjectMethod中提取watch属性信息
 */
function extractWatchFromObjectMethod(
  method: ObjectMethod
): WatchPropertyInfo | null {
  const name = extractPropertyName(method.key)

  if (!name) {
    return null
  }

  const parameters = method.params.map(param => {
    if (param.type === 'Identifier') {
      return param.name
    }
    return 'param'
  })

  return {
    name,
    dependencies: [name],
    parameters,
    callbackType: 'function',
    position: getLocationFromNode(method)
  }
}

/**
 * 从ObjectProperty中提取watch属性信息
 */
function extractWatchFromObjectProperty(
  property: ObjectProperty
): WatchPropertyInfo | null {
  const name = extractPropertyName(property.key)

  if (!name) {
    return null
  }

  const value = property.value
  let parameters: string[] = []
  let isDeep = false
  let isImmediate = false
  let callbackType: 'function' | 'object' = 'function'

  if (
    value.type === 'ArrowFunctionExpression' ||
    value.type === 'FunctionExpression'
  ) {
    parameters = parseParameters(value)
  } else if (value.type === 'ObjectExpression') {
    callbackType = 'object'

    for (const prop of value.properties) {
      // 只处理有key属性的元素（ObjectMethod和ObjectProperty）
      if ('key' in prop) {
        const propName = extractPropertyName(prop.key)

        if (propName === 'handler') {
          if (prop.type === 'ObjectMethod') {
            // 处理 ObjectMethod 类型的 handler
            parameters = prop.params.map((param): string => {
              if (param.type === 'Identifier') {
                return param.name
              }
              return 'param'
            })
          } else if (prop.type === 'ObjectProperty') {
            // 处理 ObjectProperty 类型的 handler
            if (
              prop.value.type === 'ArrowFunctionExpression' ||
              prop.value.type === 'FunctionExpression'
            ) {
              parameters = parseParameters(prop.value)
            }
          }
        } else if (
          propName === 'deep' &&
          prop.type === 'ObjectProperty' &&
          prop.value.type === 'BooleanLiteral'
        ) {
          isDeep = prop.value.value
        } else if (
          propName === 'immediate' &&
          prop.type === 'ObjectProperty' &&
          prop.value.type === 'BooleanLiteral'
        ) {
          isImmediate = prop.value.value
        }
      }
    }
  }

  return {
    name,
    dependencies: [name],
    parameters,
    isDeep,
    isImmediate,
    callbackType,
    position: getLocationFromNode(property)
  }
}

/**
 * 处理组件选项中的watch属性
 */
function extractWatchFromComponentOptions(
  watchProperty: ObjectProperty
): WatchPropertyInfo[] {
  const watchProperties: WatchPropertyInfo[] = []

  if (watchProperty.value.type === 'ObjectExpression') {
    const watchObject = watchProperty.value

    for (const prop of watchObject.properties) {
      if (prop.type === 'ObjectMethod') {
        const watchInfo = extractWatchFromObjectMethod(prop)
        if (watchInfo) {
          watchProperties.push(watchInfo)
        }
      } else if (prop.type === 'ObjectProperty') {
        const watchInfo = extractWatchFromObjectProperty(prop)
        if (watchInfo) {
          watchProperties.push(watchInfo)
        }
      }
    }
  }

  return watchProperties
}

/**
  

 * 从组件选项对象中提取watch属性
 */
function extractWatchFromOptionsObject(
  options: ObjectExpression
): WatchPropertyInfo[] {
  const watchProperties: WatchPropertyInfo[] = []

  for (const prop of options.properties) {
    if (prop.type === 'ObjectProperty') {
      const propName = extractPropertyName(prop.key)

      if (propName === 'watch') {
        const extracted = extractWatchFromComponentOptions(prop)
        watchProperties.push(...extracted)
      }
    }
  }

  return watchProperties
}

/**
 * 从语句中提取watch属性
 */
function extractWatchFromStatement(stmt: Statement): WatchPropertyInfo[] {
  const watchProperties: WatchPropertyInfo[] = []

  // 处理export default声明
  if (stmt.type === 'ExportDefaultDeclaration') {
    const declaration = stmt.declaration

    // 处理defineComponent调用
    if (
      declaration.type === 'CallExpression' &&
      declaration.callee.type === 'Identifier' &&
      declaration.callee.name === 'defineComponent'
    ) {
      const args = declaration.arguments
      if (args.length > 0 && args[0].type === 'ObjectExpression') {
        const componentOptions = args[0]
        const extracted = extractWatchFromOptionsObject(componentOptions)
        watchProperties.push(...extracted)
      }
    }
    // 处理直接对象表达式
    else if (declaration.type === 'ObjectExpression') {
      const extracted = extractWatchFromOptionsObject(declaration)
      watchProperties.push(...extracted)
    }
  }

  return watchProperties
}

/**
 * 提取Vue组件中的watch属性信息
 */
export function extractWatchProperties(ast: Statement[]): WatchPropertyInfo[] {
  const watchProperties: WatchPropertyInfo[] = []

  for (const stmt of ast) {
    const extracted = extractWatchFromStatement(stmt)
    watchProperties.push(...extracted)
  }

  logger.debug(`Extracted ${watchProperties.length} watch properties`)
  return watchProperties
}
