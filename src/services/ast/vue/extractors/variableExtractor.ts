import type {
  Statement,
  ObjectMethod,
  VariableDeclarator,
  FunctionExpression,
  ArrowFunctionExpression
} from '@babel/types'
import type {
  VariableInfo,
  DataPropertyInfo,
  RefInfo,
  ReactiveInfo
} from '../types'
import {
  getPositionFromNode,
  getEndPositionFromNode,
  extractVariableName,
  parseTypeAnnotation,
  isRefOrReactive,
  extractInitialValue,
  processSetupFunction,
  REACTIVE_FUNCTIONS,
  REF_FUNCTIONS
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
              startPosition: getPositionFromNode(prop),
              endPosition: getEndPositionFromNode(prop)
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

export function extractVariables(ast: Statement[]): VariableInfo[] {
  const variables: VariableInfo[] = []

  for (const stmt of ast) {
    const extractedVars = extractVariablesFromStatement(stmt)
    variables.push(...extractedVars)
  }

  logger.debug(`Extracted ${variables.length} variables`)
  return variables
}

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

export function extractRefs(ast: Statement[]): RefInfo[] {
  const refs: RefInfo[] = []

  for (const stmt of ast) {
    const extractedRefs = extractRefsFromStatement(stmt)
    refs.push(...extractedRefs)
  }

  logger.debug(`Extracted ${refs.length} refs`)
  return refs
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

export function extractDataProperties(ast: Statement[]): DataPropertyInfo[] {
  const dataProperties: DataPropertyInfo[] = []

  for (const stmt of ast) {
    const extractedProps = extractDataPropertiesFromStatement(stmt)
    dataProperties.push(...extractedProps)
  }

  logger.debug(`Extracted ${dataProperties.length} data properties`)
  return dataProperties
}
