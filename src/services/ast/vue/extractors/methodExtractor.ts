import type {
  Statement,
  ObjectExpression,
  ArrowFunctionExpression,
  FunctionExpression,
  FunctionDeclaration,
  ObjectMethod,
  BlockStatement,
  TSTypeAnnotation,
  TypeAnnotation,
  Noop,
  ObjectPattern,
  ArrayPattern,
  RestElement,
  AssignmentPattern,
  Identifier,
  PatternLike,
  TSType,
  VoidPattern
} from '@babel/types'
import type { VueMethodInfo } from '../types'
import {
  getPositionFromNode,
  getIdentifierName,
  getQualifiedNameName,
  isDefineComponentCall
} from './extractUtil'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

const UNKNOWN_TYPE = 'unknown'
const SETUP_FUNCTION_NAME = 'setup'
const METHODS_PROPERTY_NAME = 'methods'
const EXTEND_METHOD_NAME = 'extend'
const PROPS_PARAM_NAME = 'props'
const CONTEXT_PARAM_NAME = 'context'
const TYPE_LITERAL_PLACEHOLDER = '{ ... }'
const DEFAULT_PARAM_NAME = 'param'

function wrapTypeAnnotation(type: TSType): TSTypeAnnotation {
  return { type: 'TSTypeAnnotation', typeAnnotation: type }
}

function parseTypeAnnotation(
  typeAnnotation: TSTypeAnnotation | TypeAnnotation | Noop
): string {
  if (!typeAnnotation || typeAnnotation.type === 'Noop') {
    return UNKNOWN_TYPE
  }

  const type = typeAnnotation.typeAnnotation

  switch (type.type) {
    case 'TSStringKeyword':
      return 'string'
    case 'TSNumberKeyword':
      return 'number'
    case 'TSBooleanKeyword':
      return 'boolean'
    case 'TSAnyKeyword':
      return 'any'
    case 'TSUnknownKeyword':
      return UNKNOWN_TYPE
    case 'TSVoidKeyword':
      return 'void'
    case 'TSNullKeyword':
      return 'null'
    case 'TSUndefinedKeyword':
      return 'undefined'
    case 'TSNeverKeyword':
      return 'never'
    case 'TSArrayType':
      return `${parseTypeAnnotation(wrapTypeAnnotation(type.elementType))}[]`
    case 'TSTypeReference':
      if (type.typeName.type === 'Identifier') {
        const typeName = type.typeName.name
        if (type.typeParameters && type.typeParameters.params.length > 0) {
          const typeParams = type.typeParameters.params
            .map(p => parseTypeAnnotation(wrapTypeAnnotation(p)))
            .join(', ')
          return `${typeName}<${typeParams}>`
        }
        return typeName
      } else if (type.typeName.type === 'TSQualifiedName') {
        const typeName = `${getQualifiedNameName(type.typeName)}`
        if (type.typeParameters && type.typeParameters.params.length > 0) {
          const typeParams = type.typeParameters.params
            .map(p => parseTypeAnnotation(wrapTypeAnnotation(p)))
            .join(', ')
          return `${typeName}<${typeParams}>`
        }
        return typeName
      }
      return UNKNOWN_TYPE
    case 'TSUnionType':
      return type.types
        .map(t => parseTypeAnnotation(wrapTypeAnnotation(t)))
        .join(' | ')
    case 'TSIntersectionType':
      return type.types
        .map(t => parseTypeAnnotation(wrapTypeAnnotation(t)))
        .join(' & ')
    case 'TSFunctionType':
      const params = type.parameters
        .map(p => {
          if (p.type === 'Identifier') {
            return p.name
          }
          return DEFAULT_PARAM_NAME
        })
        .join(', ')
      const returnType = type.typeAnnotation
        ? parseTypeAnnotation(type.typeAnnotation)
        : 'void'
      return `(${params}) => ${returnType}`
    case 'TSTypeLiteral':
      return TYPE_LITERAL_PLACEHOLDER
    case 'TSTupleType':
      return `[${type.elementTypes
        .filter((t): t is TSType => t.type !== 'TSNamedTupleMember')
        .map(t => parseTypeAnnotation(wrapTypeAnnotation(t)))
        .join(', ')}]`
    default:
      return UNKNOWN_TYPE
  }
}

/**
 * 解析Vue组件中的方法
 * @param ast AST节点数组
 * @returns 解析后的方法信息数组
 */
export function extractMethods(ast: Statement[]): VueMethodInfo[] {
  const methods: VueMethodInfo[] = []

  // 遍历AST节点
  for (const node of ast) {
    // 检查直接声明的函数 - 适用于 <script setup> 语法
    if (node.type === 'FunctionDeclaration') {
      const funcDecl = node
      extractFunctionInfo(funcDecl, methods)
    }

    // 检查变量声明中的函数 - 适用于 <script setup> 语法
    if (node.type === 'VariableDeclaration') {
      for (const declarator of node.declarations) {
        if (declarator.init) {
          if (
            declarator.init.type === 'FunctionExpression' ||
            declarator.init.type === 'ArrowFunctionExpression'
          ) {
            if (declarator.id.type === 'Identifier') {
              extractFunctionInfo(declarator.init, methods, declarator.id.name)
            }
          }
        }
      }
    }

    // 检查默认导出对象（Options API 和 Vue 3 defineComponent）
    if (node.type === 'ExportDefaultDeclaration') {
      const exportDecl = node
      if (exportDecl.declaration.type === 'ObjectExpression') {
        // 处理直接的对象表达式（Options API 和 Vue 2.7 Composition API）
        extractMethodsFromObject(exportDecl.declaration, methods)
        // 检查并处理 setup 函数（Vue 2.7 Composition API）
        extractMethodsFromSetupFunction(exportDecl.declaration, methods)
      } else if (exportDecl.declaration.type === 'CallExpression') {
        // 处理 defineComponent({ ... }) 的情况
        const callExpr = exportDecl.declaration
        logger.debug(
          'Found CallExpression in ExportDefaultDeclaration:',
          callExpr.callee.type
        )
        // 检查是否是 defineComponent 调用
        if (isDefineComponentCall(callExpr)) {
          logger.debug('Found defineComponent call')
          if (
            callExpr.arguments.length > 0 &&
            callExpr.arguments[0].type === 'ObjectExpression'
          ) {
            const defineComponentObj = callExpr.arguments[0]
            logger.debug('Extracting methods from defineComponent object')
            extractMethodsFromObject(defineComponentObj, methods)

            // 处理 Vue 3 setup 函数内部的方法
            logger.debug('Extracting methods from setup function')
            extractMethodsFromSetupFunction(defineComponentObj, methods)
          }
        }
      }
    }

    // 检查赋值表达式（Vue.extend()）
    if (node.type === 'ExpressionStatement') {
      const exprStmt = node
      if (exprStmt.expression.type === 'CallExpression') {
        const callExpr = exprStmt.expression
        // 检查是否为 Vue.extend() 调用
        if (
          callExpr.callee.type === 'MemberExpression' &&
          callExpr.callee.property.type === 'Identifier' &&
          getIdentifierName(callExpr.callee.property) === EXTEND_METHOD_NAME
        ) {
          if (
            callExpr.arguments.length > 0 &&
            callExpr.arguments[0].type === 'ObjectExpression'
          ) {
            extractMethodsFromObject(callExpr.arguments[0], methods)
          }
        }
      }
    }
  }

  return methods
}

/**
 * 从对象表达式中提取方法（Options API）
 * @param objExpr 对象表达式
 * @param methods 方法数组
 */
function extractMethodsFromObject(
  objExpr: ObjectExpression,
  methods: VueMethodInfo[]
): void {
  for (const prop of objExpr.properties) {
    if (prop.type === 'ObjectProperty') {
      const objProp = prop
      if (
        objProp.key.type === 'Identifier' &&
        objProp.key.name === METHODS_PROPERTY_NAME &&
        objProp.value.type === 'ObjectExpression'
      ) {
        // 找到methods对象，提取其中的方法
        const methodsObj = objProp.value
        for (const methodProp of methodsObj.properties) {
          if (methodProp.type === 'ObjectMethod') {
            // 直接处理ObjectMethod类型
            const methodObj = methodProp
            if (methodObj.key.type === 'Identifier') {
              const methodName = methodObj.key.name
              extractFunctionInfo(methodObj, methods, methodName)
            }
          } else if (methodProp.type === 'ObjectProperty') {
            // 处理ObjectProperty类型（包含函数表达式）
            const methodObjProp = methodProp
            if (
              methodObjProp.key.type === 'Identifier' &&
              (methodObjProp.value.type === 'FunctionExpression' ||
                methodObjProp.value.type === 'ArrowFunctionExpression')
            ) {
              const methodName = methodObjProp.key.name
              extractFunctionInfo(methodObjProp.value, methods, methodName)
            }
          }
        }
      }
    }
  }
}

/**
 * 从Vue 3组件的setup函数中提取方法
 * @param objExpr 组件配置对象
 * @param methods 方法数组
 */
function extractMethodsFromSetupFunction(
  objExpr: ObjectExpression,
  methods: VueMethodInfo[]
): void {
  logger.debug('Checking for setup function in object expression')
  // 遍历组件配置对象的properties，找到setup函数
  for (const prop of objExpr.properties) {
    if (prop.type === 'ObjectProperty') {
      const objProp = prop
      if (objProp.key && objProp.key.type === 'Identifier') {
        if (
          objProp.key.name === SETUP_FUNCTION_NAME &&
          (objProp.value.type === 'FunctionExpression' ||
            objProp.value.type === 'ArrowFunctionExpression')
        ) {
          logger.debug('Found setup function with type:', objProp.value.type)
          // 找到setup函数，提取其函数体中的方法
          const setupFunc = objProp.value
          // 提取setup函数体中的所有函数声明
          logger.debug('Setup function body type:', setupFunc.body.type)
          if (setupFunc.body.type === 'BlockStatement') {
            extractFunctionsFromBlock(setupFunc.body, methods)
          }
        }
      }
    } else if (prop.type === 'ObjectMethod') {
      // 处理ObjectMethod类型的setup函数
      const objMethod = prop
      if (
        objMethod.key &&
        objMethod.key.type === 'Identifier' &&
        objMethod.key.name === SETUP_FUNCTION_NAME
      ) {
        logger.debug('Found setup function as ObjectMethod')
        logger.debug('Setup function body type:', objMethod.body.type)
        // 提取setup函数体中的所有函数声明
        extractFunctionsFromBlock(objMethod.body, methods)
      }
    }
  }
}

function parseIdentifierParam(param: {
  name: string
  typeAnnotation?: TSTypeAnnotation | TypeAnnotation | Noop | null
}): string {
  const paramName = param.name
  if (param.typeAnnotation) {
    const paramType = parseTypeAnnotation(param.typeAnnotation)
    return `${paramName}: ${paramType}`
  }
  return paramName
}

function parseObjectPatternParam(param: ObjectPattern): string {
  const paramParts: string[] = []
  for (const prop of param.properties) {
    if (prop.type === 'ObjectProperty') {
      if (prop.key?.type === 'Identifier' && prop.key.name) {
        const propName = prop.key.name
        if (prop.value?.type === 'Identifier' && prop.value.typeAnnotation) {
          const propType = parseTypeAnnotation(prop.value.typeAnnotation)
          paramParts.push(`${propName}: ${propType}`)
        } else {
          paramParts.push(propName)
        }
      } else if (prop.key?.type === 'StringLiteral' && prop.key.value) {
        const propName = prop.key.value
        paramParts.push(`"${propName}"`)
      }
    } else if (
      prop.type === 'RestElement' &&
      prop.argument?.type === 'Identifier' &&
      prop.argument.name
    ) {
      paramParts.push(`...${prop.argument.name}`)
    }
  }
  if (param.typeAnnotation) {
    const patternType = parseTypeAnnotation(param.typeAnnotation)
    return `{ ${paramParts.join(', ')} }: ${patternType}`
  }
  return `{ ${paramParts.join(', ')} }`
}

function parseArrayPatternParam(param: {
  elements: Array<PatternLike | null>
  typeAnnotation?: TSTypeAnnotation | TypeAnnotation | Noop | null
}): string {
  const elemParts: string[] = []
  for (const elem of param.elements) {
    if (!elem) continue

    if (elem.type === 'Identifier' && elem.name) {
      const elemName = elem.name
      if (elem.typeAnnotation) {
        const elemType = parseTypeAnnotation(elem.typeAnnotation)
        elemParts.push(`${elemName}: ${elemType}`)
      } else {
        elemParts.push(elemName)
      }
    } else if (
      elem.type === 'RestElement' &&
      elem.argument?.type === 'Identifier' &&
      elem.argument.name
    ) {
      elemParts.push(`...${elem.argument.name}`)
    }
  }
  if (param.typeAnnotation) {
    const arrayType = parseTypeAnnotation(param.typeAnnotation)
    return `[${elemParts.join(', ')}]: ${arrayType}`
  }
  return `[${elemParts.join(', ')}]`
}

function parseRestElementParam(param: RestElement): string {
  if (param.argument.type === 'Identifier' && param.argument.name) {
    const paramName = param.argument.name
    if (param.typeAnnotation) {
      const paramType = parseTypeAnnotation(param.typeAnnotation)
      return `...${paramName}: ${paramType}`
    }
    return `...${paramName}`
  }
  return ''
}

function parseAssignmentPatternParam(param: AssignmentPattern): string {
  if (param.left.type === 'Identifier' && param.left.name) {
    const paramName = param.left.name
    if (param.left.typeAnnotation) {
      const paramType = parseTypeAnnotation(param.left.typeAnnotation)
      return `${paramName}: ${paramType} = ...`
    }
    return `${paramName} = ...`
  }
  return ''
}

function parseFunctionParameters(
  params: Array<
    | Identifier
    | ObjectPattern
    | ArrayPattern
    | RestElement
    | AssignmentPattern
    | VoidPattern
  >
): string[] {
  const parameters: string[] = []
  for (const param of params) {
    if (param.type === 'Identifier') {
      parameters.push(parseIdentifierParam(param))
    } else if (param.type === 'ObjectPattern') {
      parameters.push(parseObjectPatternParam(param))
    } else if (param.type === 'ArrayPattern') {
      parameters.push(parseArrayPatternParam(param))
    } else if (param.type === 'RestElement') {
      parameters.push(parseRestElementParam(param))
    } else if (param.type === 'AssignmentPattern') {
      parameters.push(parseAssignmentPatternParam(param))
    }
  }
  return parameters
}

function getFunctionReturnType(
  funcExpr:
    | FunctionExpression
    | ArrowFunctionExpression
    | FunctionDeclaration
    | ObjectMethod
): string | undefined {
  return funcExpr.returnType
    ? parseTypeAnnotation(funcExpr.returnType)
    : undefined
}

/**
 * 处理可能包含函数的语句
 * @param stmt 语句
 * @param methods 方法数组
 */
function processStatement(stmt: Statement, methods: VueMethodInfo[]): void {
  if (stmt.type === 'FunctionDeclaration') {
    extractFunctionInfo(stmt, methods)
  } else if (stmt.type === 'VariableDeclaration') {
    for (const declarator of stmt.declarations) {
      if (
        declarator.init &&
        (declarator.init.type === 'FunctionExpression' ||
          declarator.init.type === 'ArrowFunctionExpression') &&
        declarator.id.type === 'Identifier'
      ) {
        extractFunctionInfo(declarator.init, methods, declarator.id.name)
      }
    }
  } else if (stmt.type === 'IfStatement') {
    if (stmt.consequent) {
      extractFunctionsFromBlock(stmt.consequent, methods)
    }
    if (stmt.alternate) {
      extractFunctionsFromBlock(stmt.alternate, methods)
    }
  } else if (
    stmt.type === 'ForStatement' ||
    stmt.type === 'ForInStatement' ||
    stmt.type === 'ForOfStatement' ||
    stmt.type === 'WhileStatement' ||
    stmt.type === 'DoWhileStatement'
  ) {
    if (stmt.body) {
      extractFunctionsFromBlock(stmt.body, methods)
    }
  } else if (stmt.type === 'TryStatement') {
    if (stmt.block) {
      extractFunctionsFromBlock(stmt.block, methods)
    }
    if (stmt.handler) {
      extractFunctionsFromBlock(stmt.handler.body, methods)
    }
    if (stmt.finalizer) {
      extractFunctionsFromBlock(stmt.finalizer, methods)
    }
  }
}

/**
 * 从代码块中提取所有函数声明
 * @param blockStatement 代码块语句
 * @param methods 方法数组
 */
function extractFunctionsFromBlock(
  blockStatement: BlockStatement | Statement,
  methods: VueMethodInfo[]
): void {
  if (
    blockStatement &&
    blockStatement.type === 'BlockStatement' &&
    blockStatement.body
  ) {
    for (const stmt of blockStatement.body) {
      processStatement(stmt, methods)
    }
  }
}

/**
 * 从函数表达式中提取函数信息
 * @param funcExpr 函数表达式或箭头函数表达式
 * @param methods 方法数组
 * @param name 函数名称（可选）
 */
function extractFunctionInfo(
  funcExpr:
    | FunctionExpression
    | ArrowFunctionExpression
    | FunctionDeclaration
    | ObjectMethod,
  methods: VueMethodInfo[],
  name?: string
): void {
  const methodName =
    name ||
    (funcExpr.type === 'FunctionDeclaration' && funcExpr.id
      ? funcExpr.id.name
      : '')

  if (!methodName) return

  const parameters = parseFunctionParameters(funcExpr.params)
  const returnType = getFunctionReturnType(funcExpr)
  const isAsync = funcExpr.async || false

  const startPosition = getPositionFromNode(funcExpr)
  const endPosition = {
    row: funcExpr.loc?.end?.line || 0,
    column: funcExpr.loc?.end?.column || 0
  }

  methods.push({
    name: methodName,
    parameters,
    returnType,
    isAsync,
    startPosition,
    endPosition
  })
}

/**
 * 检查是否为Vue组件的setup函数
 * @param funcName 函数名称
 * @param params 参数列表
 * @returns 是否为setup函数
 */
export function isSetupFunction(funcName: string, params: string[]): boolean {
  return (
    funcName === SETUP_FUNCTION_NAME &&
    (params.length === 0 ||
      (params.length === 1 && params[0] === PROPS_PARAM_NAME) ||
      (params.length === 2 &&
        params[0] === PROPS_PARAM_NAME &&
        params[1] === CONTEXT_PARAM_NAME))
  )
}
