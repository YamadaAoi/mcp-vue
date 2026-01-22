import type {
  Statement,
  ObjectMethod,
  FunctionExpression,
  ArrowFunctionExpression
} from '@babel/types'
import type { DataPropertyInfo } from '../types'
import {
  getLocationFromNode,
  parseTypeAnnotation,
  extractInitialValue
} from './extractUtil'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

function extractDataPropertiesFromStatement(
  stmt: Statement
): DataPropertyInfo[] {
  const dataProperties: DataPropertyInfo[] = []

  if (stmt.type !== 'ExportDefaultDeclaration') {
    return dataProperties
  }

  const declaration = stmt.declaration
  if (declaration.type !== 'ObjectExpression') {
    return dataProperties
  }

  const processDataFunction = (
    func: ObjectMethod | FunctionExpression | ArrowFunctionExpression
  ) => {
    if (func.body.type !== 'BlockStatement') {
      return
    }

    for (const bodyStmt of func.body.body) {
      if (
        bodyStmt.type === 'ReturnStatement' &&
        bodyStmt.argument &&
        bodyStmt.argument.type === 'ObjectExpression'
      ) {
        // 由于已经检查了类型，TypeScript 应该能正确推断 bodyStmt.argument 是 ObjectExpression 类型
        for (const prop of bodyStmt.argument.properties) {
          if (
            prop.type === 'ObjectProperty' &&
            prop.key.type === 'Identifier'
          ) {
            let type: string | undefined = undefined
            if ('typeAnnotation' in prop.value && prop.value.typeAnnotation) {
              type = parseTypeAnnotation(prop.value.typeAnnotation)
            }

            dataProperties.push({
              name: prop.key.name,
              type,
              initialValue: extractInitialValue(prop.value),
              position: getLocationFromNode(prop)
            })
          }
        }
      }
    }
  }

  for (const prop of declaration.properties) {
    if (
      (prop.type === 'ObjectMethod' || prop.type === 'ObjectProperty') &&
      prop.key.type === 'Identifier' &&
      prop.key.name === 'data'
    ) {
      if (prop.type === 'ObjectMethod') {
        processDataFunction(prop)
      } else if (
        prop.type === 'ObjectProperty' &&
        (prop.value.type === 'FunctionExpression' ||
          prop.value.type === 'ArrowFunctionExpression')
      ) {
        processDataFunction(prop.value)
      }
    }
  }

  return dataProperties
}

export function extractDataProperties(ast: Statement[]): DataPropertyInfo[] {
  const dataProperties: DataPropertyInfo[] = []

  for (const stmt of ast) {
    const extractedProps = extractDataPropertiesFromStatement(stmt)
    dataProperties.push(...extractedProps)
  }

  logger.debug(`Extracted ${dataProperties.length} data properties`)
  return dataProperties
}
