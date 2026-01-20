import type {
  Statement,
  TSType,
  TSTypeAnnotation,
  TypeAnnotation,
  ObjectMethod,
  Expression,
  Pattern,
  PatternLike,
  RestElement,
  VariableDeclarator,
  LVal,
  FunctionExpression,
  ArrowFunctionExpression,
  VoidPattern,
  Noop,
  SpreadElement,
  ObjectExpression,
  ArgumentPlaceholder
} from '@babel/types'
import type {
  VariableInfo,
  DataPropertyInfo,
  RefInfo,
  ReactiveInfo,
  ExposeInfo
} from '../types'
import { getPositionFromNode, getEndPositionFromNode } from './extractUtil'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

const REACTIVE_FUNCTIONS = [
  'reactive',
  'shallowReactive',
  'readonly',
  'shallowReadonly'
]

const REF_FUNCTIONS = ['ref', 'shallowRef', 'toRef', 'toRefs']

// Vue macro constants
const DEFINE_EXPOSE = 'defineExpose'

function extractVariableName(id: LVal | VoidPattern): string | null {
  switch (id.type) {
    case 'Identifier':
      const identifier = id
      return identifier.name
    case 'ObjectPattern':
      return '{ ... }'
    case 'ArrayPattern':
      return '[ ... ]'
    case 'RestElement':
      const restElement = id
      const argument = restElement.argument
      if (argument.type === 'Identifier') {
        return `...${argument.name}`
      } else {
        return '...args'
      }
    case 'AssignmentPattern':
      const assignmentPattern = id
      const left = assignmentPattern.left
      if (left.type === 'Identifier') {
        return left.name
      } else {
        return '{ ... }'
      }
    case 'VoidPattern':
      return null
    default:
      return null
  }
}

// Helper function to check if a variable is a ref function call
function isRef(declarator: VariableDeclarator): boolean {
  if (!declarator.init || declarator.init.type !== 'CallExpression') {
    return false
  }

  const callExpression = declarator.init
  if (callExpression.callee.type !== 'Identifier') {
    return false
  }

  const funcName = callExpression.callee.name
  return REF_FUNCTIONS.includes(funcName)
}

// Helper function to check if a variable is a reactive function call
function isReactive(declarator: VariableDeclarator): boolean {
  if (!declarator.init || declarator.init.type !== 'CallExpression') {
    return false
  }

  const callExpression = declarator.init
  if (callExpression.callee.type !== 'Identifier') {
    return false
  }

  const funcName = callExpression.callee.name
  return REACTIVE_FUNCTIONS.includes(funcName)
}

// Helper function to check if a variable is a ref or reactive function call
function isRefOrReactive(declarator: VariableDeclarator): boolean {
  return isRef(declarator) || isReactive(declarator)
}

// Generic function to process setup functions in component declarations
function processSetupFunction<T>(
  stmt: Statement,
  processor: (stmt: Statement) => T[]
): T[] {
  const results: T[] = []

  // Process export default declarations
  if (stmt.type === 'ExportDefaultDeclaration') {
    const declaration = stmt.declaration

    let componentOptions: ObjectExpression | null = null

    // Handle defineComponent calls
    if (
      declaration.type === 'CallExpression' &&
      declaration.callee.type === 'Identifier' &&
      declaration.callee.name === 'defineComponent'
    ) {
      const args = declaration.arguments
      if (args.length > 0 && args[0].type === 'ObjectExpression') {
        componentOptions = args[0]
      }
    }
    // Handle direct object expressions
    else if (declaration.type === 'ObjectExpression') {
      componentOptions = declaration
    }

    // Process setup function if found
    if (componentOptions) {
      for (const prop of componentOptions.properties) {
        if (
          (prop.type === 'ObjectProperty' || prop.type === 'ObjectMethod') &&
          'key' in prop
        ) {
          const key = prop.key
          const isSetup =
            (key.type === 'Identifier' && key.name === 'setup') ||
            (key.type === 'StringLiteral' && key.value === 'setup')

          if (isSetup) {
            let setupFunction
            if (
              prop.type === 'ObjectProperty' &&
              prop.value.type === 'ArrowFunctionExpression'
            ) {
              setupFunction = prop.value
            } else if (prop.type === 'ObjectMethod') {
              setupFunction = prop
            }

            if (setupFunction && setupFunction.body.type === 'BlockStatement') {
              for (const setupStmt of setupFunction.body.body) {
                const nestedResults = processor(setupStmt)
                results.push(...nestedResults)
              }
            }
          }
        }
      }
    }
  }

  return results
}

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

function parseTypeAnnotation(
  typeAnnotation: TSType | TSTypeAnnotation | TypeAnnotation | Noop
): string | undefined {
  if (!typeAnnotation || typeAnnotation.type === 'Noop') {
    return undefined
  }

  if (
    typeAnnotation.type === 'TSTypeAnnotation' &&
    typeAnnotation.typeAnnotation
  ) {
    return extractTypeString(typeAnnotation.typeAnnotation)
  }

  if (
    typeAnnotation.type === 'TypeAnnotation' &&
    typeAnnotation.typeAnnotation
  ) {
    return 'flow-type'
  }

  // 处理 TSType 类型
  switch (typeAnnotation.type) {
    case 'TSStringKeyword':
    case 'TSNumberKeyword':
    case 'TSBooleanKeyword':
    case 'TSVoidKeyword':
    case 'TSAnyKeyword':
    case 'TSUnknownKeyword':
    case 'TSNullKeyword':
    case 'TSUndefinedKeyword':
    case 'TSArrayType':
    case 'TSTupleType':
    case 'TSUnionType':
    case 'TSIntersectionType':
    case 'TSTypeLiteral':
    case 'TSFunctionType':
    case 'TSParenthesizedType':
    case 'TSTypeReference':
    case 'TSLiteralType':
    case 'TSInferType':
    case 'TSConditionalType':
      return extractTypeString(typeAnnotation)
    default:
      return undefined
  }
}

function extractTypeString(type: TSType): string {
  switch (type.type) {
    case 'TSStringKeyword':
      return 'string'
    case 'TSNumberKeyword':
      return 'number'
    case 'TSBooleanKeyword':
      return 'boolean'
    case 'TSVoidKeyword':
      return 'void'
    case 'TSAnyKeyword':
      return 'any'
    case 'TSUnknownKeyword':
      return 'unknown'
    case 'TSNullKeyword':
      return 'null'
    case 'TSUndefinedKeyword':
      return 'undefined'
    case 'TSArrayType':
      return 'array'
    case 'TSTupleType':
      return 'tuple'
    case 'TSUnionType':
      return 'union'
    case 'TSIntersectionType':
      return 'intersection'
    case 'TSTypeLiteral':
      return 'object'
    case 'TSFunctionType':
      return 'function'
    case 'TSParenthesizedType':
      return extractTypeString(type.typeAnnotation)
    case 'TSTypeReference':
      return type.typeName.type === 'Identifier'
        ? type.typeName.name
        : 'unknown'
    case 'TSLiteralType':
      if (type.literal.type === 'StringLiteral') {
        return 'string'
      } else if (type.literal.type === 'NumericLiteral') {
        return 'number'
      } else if (type.literal.type === 'BooleanLiteral') {
        return 'boolean'
      } else {
        return 'literal'
      }
    case 'TSInferType':
      return 'infer'
    case 'TSConditionalType':
      return 'conditional'
    default:
      return 'unknown'
  }
}

export function extractInitialValue(
  init:
    | Expression
    | Pattern
    | PatternLike
    | RestElement
    | SpreadElement
    | ArgumentPlaceholder
    | null
    | undefined
): unknown {
  if (!init || typeof init !== 'object') {
    return undefined
  }

  switch (init.type) {
    case 'StringLiteral':
      return init.value
    case 'NumericLiteral':
      return init.value
    case 'BooleanLiteral':
      return init.value
    case 'NullLiteral':
      return null
    case 'Identifier':
      return init.name
    case 'ObjectExpression':
      return '{}'
    case 'ArrayExpression':
      return '[]'
    case 'UnaryExpression':
      if (init.operator === 'void' || init.operator === 'delete') {
        return undefined
      }
      return 'expression'
    case 'CallExpression':
      return 'function()'
    case 'ArrowFunctionExpression':
      return '() => {}'
    case 'FunctionExpression':
      return 'function() {}'
    case 'TemplateLiteral':
      return init.quasis.length === 1 ? init.quasis[0].value.raw : 'expression'
    case 'BinaryExpression':
      return 'expression'
    case 'LogicalExpression':
      return 'expression'
    case 'ConditionalExpression':
      return 'expression'
    case 'SequenceExpression':
      return 'expression'
    case 'UpdateExpression':
      return 'expression'
    case 'MemberExpression':
      return 'expression'
    case 'NewExpression':
      return 'expression'
    case 'TypeCastExpression':
      return extractInitialValue(init.expression)
    case 'TSAsExpression':
      return extractInitialValue(init.expression)
    case 'TSSatisfiesExpression':
      return extractInitialValue(init.expression)
    case 'TSTypeAssertion':
      return extractInitialValue(init.expression)
    case 'ParenthesizedExpression':
      return extractInitialValue(init.expression)
    case 'AwaitExpression':
      return 'expression'
    case 'YieldExpression':
      return 'expression'
    case 'SpreadElement':
      return '...'
    default:
      return 'expression'
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
