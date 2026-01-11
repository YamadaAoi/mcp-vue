import type {
  Statement,
  ObjectExpression,
  ArrowFunctionExpression,
  FunctionExpression,
  FunctionDeclaration,
  ObjectMethod,
  BlockStatement
} from '@babel/types'
import type { VueMethodInfo } from '../types'
import { getPositionFromNode } from './importExtractor'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

/**
 * 安全获取标识符名称的辅助函数
 * @param key 可能是标识符或其他类型的键
 * @returns 标识符名称或空字符串
 */
function getIdentifierName(key: unknown): string {
  if (
    key &&
    typeof key === 'object' &&
    'type' in key &&
    key.type === 'Identifier'
  ) {
    const identifier = key as { name?: string }
    return identifier.name || ''
  }
  return ''
}

/**
 * 解析返回类型的辅助函数
 * @param returnType 返回类型注解
 * @returns 解析后的返回类型字符串或undefined
 */
function parseReturnType(returnType: unknown): string | undefined {
  if (
    returnType &&
    typeof returnType === 'object' &&
    'type' in returnType &&
    returnType.type === 'TSTypeAnnotation'
  ) {
    const tsTypeAnnotation = returnType as { typeAnnotation?: unknown }
    if (
      tsTypeAnnotation.typeAnnotation &&
      typeof tsTypeAnnotation.typeAnnotation === 'object'
    ) {
      const typeAnnot = tsTypeAnnotation.typeAnnotation as {
        type?: string
        typeName?: unknown
      }
      switch (typeAnnot.type) {
        case 'TSStringKeyword':
          return 'string'
        case 'TSNumberKeyword':
          return 'number'
        case 'TSBooleanKeyword':
          return 'boolean'
        case 'TSAnyKeyword':
          return 'any'
        case 'TSArrayType':
          return 'Array'
        case 'TSTypeReference':
          return getIdentifierName(typeAnnot.typeName)
        default:
          return undefined
      }
    }
  }
  return undefined
}

/**
 * 检查是否为defineComponent调用
 * @param node AST节点
 * @returns 是否为defineComponent调用
 */
function isDefineComponentCall(node: unknown): boolean {
  if (
    node &&
    typeof node === 'object' &&
    'type' in node &&
    node.type === 'CallExpression'
  ) {
    const callExpr = node as { callee?: unknown }
    if (callExpr.callee && typeof callExpr.callee === 'object') {
      const callee = callExpr.callee
      if ('type' in callee) {
        if (callee.type === 'Identifier') {
          const identifier = callee as { name?: string }
          return identifier.name === 'defineComponent'
        } else if (callee.type === 'MemberExpression') {
          const memberExpr = callee as { property?: unknown }
          return getIdentifierName(memberExpr.property) === 'defineComponent'
        }
      }
    }
  }
  return false
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
          getIdentifierName(callExpr.callee.property) === 'extend'
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
        objProp.key.name === 'methods' &&
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
          objProp.key.name === 'setup' &&
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
        objMethod.key.name === 'setup'
      ) {
        logger.debug('Found setup function as ObjectMethod')
        logger.debug('Setup function body type:', objMethod.body.type)
        // 提取setup函数体中的所有函数声明
        extractFunctionsFromBlock(objMethod.body, methods)
      }
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
  // 确保blockStatement有body属性（BlockStatement类型）
  if (
    blockStatement &&
    blockStatement.type === 'BlockStatement' &&
    blockStatement.body
  ) {
    for (const stmt of blockStatement.body) {
      // 处理函数声明
      if (stmt.type === 'FunctionDeclaration') {
        extractFunctionInfo(stmt, methods)
      }
      // 处理变量声明中的函数表达式
      else if (stmt.type === 'VariableDeclaration') {
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
      }
      // 递归处理嵌套的代码块（例如if语句、for循环等）
      else if (stmt.type === 'IfStatement') {
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

  // 提取参数信息
  const parameters: string[] = []
  for (const param of funcExpr.params) {
    if (param.type === 'Identifier') {
      parameters.push(param.name)
    } else if (param.type === 'ObjectPattern') {
      // 处理解构参数 { prop1, prop2 } => [{ name: 'prop1' }, { name: 'prop2' }]
      for (const prop of param.properties) {
        if (prop.type === 'ObjectProperty') {
          const objProp = prop
          if (objProp.key.type === 'Identifier') {
            parameters.push(objProp.key.name)
          }
        }
      }
    } else if (param.type === 'ArrayPattern') {
      // 处理数组解构参数 [arg1, arg2] => [{ name: 'arg1' }, { name: 'arg2' }]
      for (const elem of param.elements) {
        if (elem && elem.type === 'Identifier') {
          parameters.push(elem.name)
        }
      }
    }
  }

  // 提取返回类型（简单实现，实际可能需要更复杂的类型解析）
  let returnType: string | undefined
  if (
    funcExpr.type === 'FunctionDeclaration' ||
    funcExpr.type === 'FunctionExpression'
  ) {
    returnType = parseReturnType(funcExpr.returnType)
  }

  // 检查是否为异步函数
  const isAsync = funcExpr.async || false

  // 提取位置信息
  const startPosition = getPositionFromNode(funcExpr)
  const endPosition = {
    row: funcExpr.loc?.end?.line || 0,
    column: funcExpr.loc?.end?.column || 0
  }

  // 添加到结果数组
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
    funcName === 'setup' &&
    (params.length === 0 ||
      (params.length === 1 && params[0] === 'props') ||
      (params.length === 2 && params[0] === 'props' && params[1] === 'context'))
  )
}
