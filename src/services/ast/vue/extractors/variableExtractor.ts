import type { Statement, ObjectMethod, VariableDeclarator } from '@babel/types'
import type { VariableInfo } from '../types'
import {
  getLocationFromNode,
  extractVariableName,
  parseTypeAnnotation,
  isRefOrReactive,
  extractInitialValue
} from './extractUtil'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

function processVariableDeclarator(
  declarator: VariableDeclarator,
  isConst: boolean
): VariableInfo | null {
  const id = declarator.id
  const name = extractVariableName(id)

  if (!name) {
    return null
  }

  // Skip ref and reactive variables as they are handled by refExtractor
  if (isRefOrReactive(declarator)) {
    return null
  }

  let type: string | undefined = undefined
  if ('typeAnnotation' in id && id.typeAnnotation) {
    type = parseTypeAnnotation(id.typeAnnotation)
  }

  const value = extractInitialValue(declarator.init)

  return {
    name,
    type,
    value,
    isConst,
    position: getLocationFromNode(declarator)
  }
}

function extractVariablesFromStatement(stmt: Statement): VariableInfo[] {
  const variables: VariableInfo[] = []

  const processVariableDeclaration = (varDecl: Statement) => {
    if (varDecl.type !== 'VariableDeclaration') return

    for (const declarator of varDecl.declarations) {
      const variable = processVariableDeclarator(
        declarator,
        varDecl.kind === 'const'
      )
      if (variable) {
        variables.push(variable)
      }
    }
  }

  const processSetupFunction = (setupFunction: ObjectMethod) => {
    if (setupFunction.body.type === 'BlockStatement') {
      const blockStmt = setupFunction.body
      for (const setupStmt of blockStmt.body) {
        processVariableDeclaration(setupStmt)
      }
    }
  }

  // Process top-level variable declarations
  processVariableDeclaration(stmt)

  // Process setup function in export default declaration
  if (stmt.type === 'ExportDefaultDeclaration') {
    const declaration = stmt.declaration

    // Early returns for non-object expressions to avoid unnecessary checks
    if (declaration.type === 'ObjectExpression') {
      for (const prop of declaration.properties) {
        // Direct property checks without additional function calls
        if (
          prop.type === 'ObjectMethod' &&
          prop.key.type === 'Identifier' &&
          prop.key.name === 'setup'
        ) {
          processSetupFunction(prop)
        }
      }
    } else if (declaration.type === 'CallExpression') {
      const callExpr = declaration
      // Early return if not defineComponent call
      if (
        callExpr.callee.type !== 'Identifier' ||
        callExpr.callee.name !== 'defineComponent'
      ) {
        return variables
      }

      const firstArg = callExpr.arguments[0]
      // Check first argument directly
      if (firstArg && firstArg.type === 'ObjectExpression') {
        for (const prop of firstArg.properties) {
          if (
            prop.type === 'ObjectMethod' &&
            prop.key.type === 'Identifier' &&
            prop.key.name === 'setup'
          ) {
            processSetupFunction(prop)
          }
        }
      }
    }
  }

  return variables
}

export function extractVariables(ast: Statement[]): VariableInfo[] {
  const variables: VariableInfo[] = []

  for (const stmt of ast) {
    const extractedVars = extractVariablesFromStatement(stmt)
    variables.push(...extractedVars)
  }

  logger.debug(`Extracted ${variables.length} variables`)
  return variables
}
