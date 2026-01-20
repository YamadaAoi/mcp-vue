import type { Statement, ObjectMethod, VariableDeclarator } from '@babel/types'
import type { VariableInfo, ReactiveInfo } from '../types'
import {
  getPositionFromNode,
  getEndPositionFromNode,
  extractVariableName,
  parseTypeAnnotation,
  isRefOrReactive,
  extractInitialValue,
  processSetupFunction,
  REACTIVE_FUNCTIONS
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
    startPosition: getPositionFromNode(declarator),
    endPosition: getEndPositionFromNode(declarator)
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

function extractReactiveFromDeclarator(
  declarator: VariableDeclarator
): ReactiveInfo | null {
  // Check if it's an identifier
  if (declarator.id.type !== 'Identifier') {
    return null
  }

  // Check if it's a reactive function call
  if (
    !declarator.init ||
    declarator.init.type !== 'CallExpression' ||
    declarator.init.callee.type !== 'Identifier'
  ) {
    return null
  }

  const callee = declarator.init.callee
  const funcName = callee.name

  if (!REACTIVE_FUNCTIONS.includes(funcName)) {
    return null
  }

  // Extract reactive name
  const name = declarator.id.name

  // Extract type annotation if available
  let type: string | undefined = undefined
  if ('typeAnnotation' in declarator.id && declarator.id.typeAnnotation) {
    type = parseTypeAnnotation(declarator.id.typeAnnotation)
  }

  // Extract initial value
  const initialValue =
    declarator.init.arguments.length > 0
      ? extractInitialValue(declarator.init.arguments[0])
      : undefined

  // Check if it's a shallow reactive
  const isShallow =
    funcName === 'shallowReactive' || funcName === 'shallowReadonly'

  return {
    name,
    type,
    initialValue,
    isShallow,
    startPosition: getPositionFromNode(declarator),
    endPosition: getEndPositionFromNode(declarator)
  }
}

function extractReactiveFromStatement(stmt: Statement): ReactiveInfo[] {
  const reactives: ReactiveInfo[] = []

  // Process variable declarations
  if (stmt.type === 'VariableDeclaration') {
    for (const declarator of stmt.declarations) {
      const reactive = extractReactiveFromDeclarator(declarator)
      if (reactive) {
        reactives.push(reactive)
      }
    }
  }
  // Process function bodies
  else if (stmt.type === 'FunctionDeclaration') {
    if (stmt.body.type === 'BlockStatement') {
      for (const bodyStmt of stmt.body.body) {
        const nestedReactive = extractReactiveFromStatement(bodyStmt)
        reactives.push(...nestedReactive)
      }
    }
  }
  // Process setup functions in component declarations
  else {
    const setupReactive = processSetupFunction(
      stmt,
      extractReactiveFromStatement
    )
    reactives.push(...setupReactive)
  }

  return reactives
}

export function extractReactive(ast: Statement[]): ReactiveInfo[] {
  const reactives: ReactiveInfo[] = []

  for (const stmt of ast) {
    const extractedReactive = extractReactiveFromStatement(stmt)
    reactives.push(...extractedReactive)
  }

  logger.debug(`Extracted ${reactives.length} reactive objects`)
  return reactives
}
