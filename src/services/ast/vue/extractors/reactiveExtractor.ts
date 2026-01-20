import type { Statement, VariableDeclarator } from '@babel/types'
import type { ReactiveInfo } from '../types'
import {
  getLocationFromNode,
  parseTypeAnnotation,
  extractInitialValue,
  processSetupFunction,
  REACTIVE_FUNCTIONS
} from './extractUtil'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

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
    position: getLocationFromNode(declarator)
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
