import type { Statement } from '@babel/types'
import type { ExposeInfo } from '../types'
import {
  getPositionFromNode,
  getEndPositionFromNode,
  parseTypeAnnotation,
  extractInitialValue,
  processSetupFunction,
  DEFINE_EXPOSE
} from './extractUtil'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

function extractExposeFromStatement(stmt: Statement): ExposeInfo[] {
  const exposeInfo: ExposeInfo[] = []

  // Process defineExpose calls in setup function
  if (
    stmt.type === 'ExpressionStatement' &&
    stmt.expression.type === 'CallExpression'
  ) {
    const callExpr = stmt.expression

    // Check if it's a defineExpose call
    if (
      callExpr.callee.type === 'Identifier' &&
      callExpr.callee.name === DEFINE_EXPOSE
    ) {
      // Check if defineExpose has an object argument
      if (
        callExpr.arguments.length > 0 &&
        callExpr.arguments[0].type === 'ObjectExpression'
      ) {
        const exposeObject = callExpr.arguments[0]

        for (const prop of exposeObject.properties) {
          // Only process ObjectProperty with Identifier key
          if (
            prop.type === 'ObjectProperty' &&
            prop.key.type === 'Identifier'
          ) {
            const name = prop.key.name
            let valueType: string | undefined = undefined
            let initialValue: unknown = undefined

            // Determine if it's a property or method
            let exposeType: 'property' | 'method' = 'property'

            // Check if it's a direct function definition
            const propValueType = prop.value.type
            if (
              propValueType === 'FunctionExpression' ||
              propValueType === 'ArrowFunctionExpression' ||
              // Check if it's a CallExpression that returns a function
              (propValueType === 'CallExpression' &&
                prop.value.callee.type === 'Identifier' &&
                ['computed', 'watch', 'watchEffect'].includes(
                  prop.value.callee.name
                ))
            ) {
              exposeType = 'method'
            }

            // Extract type annotation if available
            if ('typeAnnotation' in prop.value && prop.value.typeAnnotation) {
              // No need to set type since exposeType is dynamically determined by prop.value.type
              // But we can use parseTypeAnnotation's return value to supplement type information
              const extractedType = parseTypeAnnotation(
                prop.value.typeAnnotation
              )
              if (extractedType) {
                valueType = extractedType
              }
            }

            // Extract initial value and determine value type for properties
            if (exposeType === 'property') {
              initialValue = extractInitialValue(prop.value)

              // Determine value type from initial value directly
              if (initialValue !== undefined && initialValue !== 'expression') {
                valueType = typeof initialValue
                if (valueType === 'object' && initialValue === null) {
                  valueType = 'null'
                } else if (
                  valueType === 'object' &&
                  Array.isArray(initialValue)
                ) {
                  valueType = 'array'
                }
              }
            } else {
              // For methods, valueType is 'function'
              valueType = 'function'
            }

            exposeInfo.push({
              name,
              type: exposeType,
              valueType,
              initialValue,
              startPosition: getPositionFromNode(prop),
              endPosition: getEndPositionFromNode(prop)
            })
          }
        }
      }
    }
  }

  return exposeInfo
}

function processSetupFunctionForExpose(stmt: Statement): ExposeInfo[] {
  return processSetupFunction<ExposeInfo>(stmt, extractExposeFromStatement)
}

export function extractExpose(ast: Statement[]): ExposeInfo[] {
  const exposeInfo: ExposeInfo[] = []

  for (const stmt of ast) {
    // Process top-level defineExpose calls
    const topLevelExpose = extractExposeFromStatement(stmt)
    exposeInfo.push(...topLevelExpose)

    // Process defineExpose calls inside setup function
    const setupExpose = processSetupFunctionForExpose(stmt)
    exposeInfo.push(...setupExpose)
  }

  logger.debug(`Extracted ${exposeInfo.length} expose entries`)
  return exposeInfo
}
