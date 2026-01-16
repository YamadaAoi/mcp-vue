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
  Node,
  LVal,
  FunctionExpression,
  ArrowFunctionExpression,
  VoidPattern,
  Noop,
  SpreadElement,
  ObjectExpression
} from '@babel/types'
import type { VariableInfo, DataPropertyInfo } from '../types'
import { getPositionFromNode } from './importExtractor'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

function getEndPositionFromNode(node: Node): {
  row: number
  column: number
} {
  const position = node?.loc?.end
  return {
    row: position?.line || 0,
    column: position?.column || 0
  }
}

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

function processVariableDeclarator(
  declarator: VariableDeclarator,
  isConst: boolean
): VariableInfo | null {
  const id = declarator.id
  const name = extractVariableName(id)

  if (!name) {
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

  return extractTypeString(typeAnnotation as TSType)
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

function extractInitialValue(
  init:
    | Expression
    | Pattern
    | PatternLike
    | RestElement
    | SpreadElement
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
        const returnStmt = bodyStmt
        const objectExpr = returnStmt.argument as ObjectExpression
        for (const prop of objectExpr.properties) {
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

export function extractDataProperties(ast: Statement[]): DataPropertyInfo[] {
  const dataProperties: DataPropertyInfo[] = []

  for (const stmt of ast) {
    const extractedProps = extractDataPropertiesFromStatement(stmt)
    dataProperties.push(...extractedProps)
  }

  logger.debug(`Extracted ${dataProperties.length} data properties`)
  return dataProperties
}
