import type { Statement, VariableDeclarator } from '@babel/types'
import type { RefInfo } from '../types'
import {
  getPositionFromNode,
  getEndPositionFromNode,
  parseTypeAnnotation,
  extractInitialValue,
  processSetupFunction,
  REF_FUNCTIONS
} from './extractUtil'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

function extractRefFromDeclarator(
  declarator: VariableDeclarator
): RefInfo | null {
  // Check if it's an identifier
  if (declarator.id.type !== 'Identifier') {
    return null
  }

  // Check if it's a ref function call
  if (
    !declarator.init ||
    declarator.init.type !== 'CallExpression' ||
    declarator.init.callee.type !== 'Identifier'
  ) {
    return null
  }

  const callee = declarator.init.callee
  const funcName = callee.name

  if (!REF_FUNCTIONS.includes(funcName)) {
    return null
  }

  // Extract ref name
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

  // Check if it's a shallow ref
  const isShallow = funcName === 'shallowRef'

  return {
    name,
    type,
    initialValue,
    isShallow,
    startPosition: getPositionFromNode(declarator),
    endPosition: getEndPositionFromNode(declarator)
  }
}

function extractRefsFromStatement(stmt: Statement): RefInfo[] {
  const refs: RefInfo[] = []

  // Process variable declarations
  if (stmt.type === 'VariableDeclaration') {
    for (const declarator of stmt.declarations) {
      const ref = extractRefFromDeclarator(declarator)
      if (ref) {
        refs.push(ref)
      }
    }
  }
  // Process function bodies
  else if (stmt.type === 'FunctionDeclaration') {
    if (stmt.body.type === 'BlockStatement') {
      for (const bodyStmt of stmt.body.body) {
        const nestedRefs = extractRefsFromStatement(bodyStmt)
        refs.push(...nestedRefs)
      }
    }
  }
  // Process setup functions in component declarations
  else {
    const setupRefs = processSetupFunction(stmt, extractRefsFromStatement)
    refs.push(...setupRefs)
  }

  return refs
}

export function extractRefs(ast: Statement[]): RefInfo[] {
  const refs: RefInfo[] = []

  for (const stmt of ast) {
    const extractedRefs = extractRefsFromStatement(stmt)
    refs.push(...extractedRefs)
  }

  logger.debug(`Extracted ${refs.length} refs`)
  return refs
}
