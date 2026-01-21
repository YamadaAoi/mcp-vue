import type {
  Expression,
  Identifier,
  ObjectPattern,
  ArrayPattern,
  RestElement,
  AssignmentPattern,
  VoidPattern,
  LVal,
  TSQualifiedName,
  CallExpression,
  TSTypeAnnotation,
  TypeAnnotation,
  TSType,
  Noop,
  VariableDeclarator,
  Statement,
  Pattern,
  PatternLike,
  SpreadElement,
  ObjectExpression,
  ArgumentPlaceholder,
  StringLiteral,
  ArrayExpression,
  MemberExpression,
  ArrowFunctionExpression,
  FunctionExpression
} from '@babel/types'

// 类型常量
export const UNKNOWN_TYPE = 'unknown'
export const DEFAULT_PARAM_NAME = 'param'
export const TYPE_LITERAL_PLACEHOLDER = '{ ... }'

/**
 * Vue reactive 函数列表
 */
export const REACTIVE_FUNCTIONS = [
  'reactive',
  'shallowReactive',
  'readonly',
  'shallowReadonly'
]

/**
 * Vue ref 函数列表
 */
export const REF_FUNCTIONS = ['ref', 'shallowRef', 'toRef', 'toRefs']

/**
 * Vue defineExpose 宏名称
 */
export const DEFINE_EXPOSE = 'defineExpose'

/**
 * 检查节点是否为标识符
 */
export function isIdentifier(node: unknown): node is Identifier {
  return !!(
    node &&
    typeof node === 'object' &&
    'type' in node &&
    node.type === 'Identifier' &&
    'name' in node
  )
}

/**
 * 检查节点是否为字符串字面量
 */
export function isStringLiteral(node: unknown): node is StringLiteral {
  return !!(
    node &&
    typeof node === 'object' &&
    'type' in node &&
    node.type === 'StringLiteral' &&
    'value' in node
  )
}

/**
 * 检查节点是否为数组表达式
 */
export function isArrayExpression(node: unknown): node is ArrayExpression {
  return !!(
    node &&
    typeof node === 'object' &&
    'type' in node &&
    node.type === 'ArrayExpression' &&
    'elements' in node
  )
}

/**
 * 检查节点是否为成员表达式
 */
export function isMemberExpression(node: unknown): node is MemberExpression {
  return !!(
    node &&
    typeof node === 'object' &&
    'type' in node &&
    node.type === 'MemberExpression' &&
    'property' in node
  )
}

/**
 * 检查节点是否为函数表达式
 */
export function isFunctionLike(
  node: unknown
): node is ArrowFunctionExpression | FunctionExpression {
  return !!(
    node &&
    typeof node === 'object' &&
    'type' in node &&
    (node.type === 'ArrowFunctionExpression' ||
      node.type === 'FunctionExpression') &&
    'params' in node
  )
}

export type LocatableNode = {
  loc?:
    | {
        start?: { line?: number; column?: number }
        end?: { line?: number; column?: number }
      }
    | null
    | undefined
}

/**
 * 从节点获取位置信息的通用函数
 * @param node AST节点
 * @returns 位置信息
 */
export function getLocationFromNode(
  node: LocatableNode
): [number, number, number, number] {
  return [
    node?.loc?.start?.line || 0,
    node?.loc?.start?.column || 0,
    node?.loc?.end?.line || 0,
    node?.loc?.end?.column || 0
  ]
}

/**
 * 解析单个参数
 * @param param 参数节点
 * @returns 参数字符串表示
 */
export function parseParameter(
  param:
    | Identifier
    | ObjectPattern
    | ArrayPattern
    | RestElement
    | AssignmentPattern
    | VoidPattern
): string {
  if (param.type === 'Identifier') {
    return param.name
  } else if (param.type === 'ObjectPattern') {
    return '{ ... }'
  } else if (param.type === 'ArrayPattern') {
    // 尝试提取数组模式中的实际参数名称
    const elements = param.elements
    if (elements.length > 0) {
      const elementNames = elements
        .map(element => {
          if (!element) return ''
          if (element.type === 'Identifier') {
            return element.name
          } else if (
            element.type === 'RestElement' &&
            element.argument.type === 'Identifier'
          ) {
            return `...${element.argument.name}`
          }
          return '...'
        })
        .filter(Boolean)
      return `[${elementNames.join(', ')}]`
    }
    return '[ ... ]'
  } else if (param.type === 'RestElement') {
    const argument = param.argument
    if (argument.type === 'Identifier') {
      return `...${argument.name || 'args'}`
    }
    return '...args'
  } else if (param.type === 'AssignmentPattern') {
    const left = param.left
    if (left.type === 'Identifier') {
      return `${left.name} = ...`
    } else if (left.type === 'ObjectPattern') {
      return '{ ... } = ...'
    } else if (left.type === 'ArrayPattern') {
      // 尝试提取数组模式中的实际参数名称
      const elements = left.elements
      if (elements.length > 0) {
        const elementNames = elements
          .map(element => {
            if (!element) return ''
            if (element.type === 'Identifier') {
              return element.name
            } else if (
              element.type === 'RestElement' &&
              element.argument.type === 'Identifier'
            ) {
              return `...${element.argument.name}`
            }
            return '...'
          })
          .filter(Boolean)
        return `[${elementNames.join(', ')}] = ...`
      }
      return '[ ... ] = ...'
    }
    return 'unknown'
  } else if (param.type === 'VoidPattern') {
    return 'void'
  }
  return 'unknown'
}

/**
 * 从函数表达式中解析参数
 * @param node 表达式节点
 * @returns 参数字符串数组
 */
export function parseParameters(node: Expression | null | undefined): string[] {
  if (!node) return []

  if (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionExpression'
  ) {
    return node.params.map(param => parseParameter(param))
  }

  return []
}

/**
 * 提取变量名
 * @param id 标识符或模式
 * @returns 变量名字符串或null
 */
export function extractVariableName(id: LVal | VoidPattern): string | null {
  switch (id.type) {
    case 'Identifier':
      return id.name
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

/**
 * 获取标识符名称
 * @param key 标识符节点
 * @returns 标识符名称
 */
export function getIdentifierName(key: Identifier | null | undefined): string {
  return key?.name || ''
}

/**
 * 获取限定名称
 * @param qualifiedName 限定名称节点
 * @returns 限定名称字符串
 */
export function getQualifiedNameName(
  qualifiedName: TSQualifiedName | null | undefined
): string {
  if (!qualifiedName) {
    return ''
  }
  const leftName =
    qualifiedName.left.type === 'Identifier'
      ? getIdentifierName(qualifiedName.left)
      : getQualifiedNameName(qualifiedName.left)
  const rightName = getIdentifierName(qualifiedName.right)
  return rightName ? `${leftName}.${rightName}` : leftName
}

/**
 * 检查是否为defineComponent调用
 * @param node 调用表达式节点
 * @returns 是否为defineComponent调用
 */
export function isDefineComponentCall(
  node: CallExpression | null | undefined
): boolean {
  if (!node) {
    return false
  }
  const callee = node.callee
  if (!callee) {
    return false
  }
  if (callee.type === 'Identifier') {
    return callee.name === 'defineComponent'
  } else if (callee.type === 'MemberExpression') {
    return (
      callee.property.type === 'Identifier' &&
      getIdentifierName(callee.property) === 'defineComponent'
    )
  }
  return false
}

/**
 * 将 TSType 包装为 TSTypeAnnotation
 * @param type TSType 类型
 * @returns TSTypeAnnotation
 */
export function wrapTypeAnnotation(type: TSType): TSTypeAnnotation {
  return { type: 'TSTypeAnnotation', typeAnnotation: type }
}

/**
 * 检查变量是否为 ref 函数调用
 * @param declarator 变量声明节点
 * @returns 是否为 ref 函数调用
 */
export function isRef(declarator: VariableDeclarator): boolean {
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

/**
 * 检查变量是否为 reactive 函数调用
 * @param declarator 变量声明节点
 * @returns 是否为 reactive 函数调用
 */
export function isReactive(declarator: VariableDeclarator): boolean {
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

/**
 * 检查变量是否为 ref 或 reactive 函数调用
 * @param declarator 变量声明节点
 * @returns 是否为 ref 或 reactive 函数调用
 */
export function isRefOrReactive(declarator: VariableDeclarator): boolean {
  return isRef(declarator) || isReactive(declarator)
}

/**
 * 从表达式中提取初始值的字符串表示
 * @param init 表达式节点
 * @returns 初始值的字符串表示或 undefined
 */
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

/**
 * 通用函数，用于处理组件声明中的 setup 函数
 * @param stmt 语句节点
 * @param processor 处理器函数
 * @returns 处理结果数组
 */
export function processSetupFunction<T>(
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

/**
 * 解析类型注解，返回详细的类型字符串
 * @param typeAnnotation 类型注解节点
 * @returns 详细的类型字符串
 */
export function parseTypeAnnotation(
  typeAnnotation:
    | TSType
    | TSTypeAnnotation
    | TypeAnnotation
    | Noop
    | undefined
    | null
): string {
  if (!typeAnnotation) {
    return UNKNOWN_TYPE
  }

  // 处理 Noop 类型
  if ('type' in typeAnnotation && typeAnnotation.type === 'Noop') {
    return UNKNOWN_TYPE
  }

  // 处理 TSTypeAnnotation 包装器
  if ('type' in typeAnnotation && typeAnnotation.type === 'TSTypeAnnotation') {
    return parseTypeAnnotation(typeAnnotation.typeAnnotation)
  }

  // 处理 Flow TypeAnnotation
  if ('type' in typeAnnotation && typeAnnotation.type === 'TypeAnnotation') {
    return 'flow-type'
  }

  // 确保我们现在处理的是 TSType
  if (!('type' in typeAnnotation)) {
    return UNKNOWN_TYPE
  }

  const type = typeAnnotation

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
      return `${parseTypeAnnotation(type.elementType)}[]`
    case 'TSTypeReference':
      if (type.typeName.type === 'Identifier') {
        const typeName = type.typeName.name
        if (type.typeParameters && type.typeParameters.params.length > 0) {
          const typeParams = type.typeParameters.params
            .map(p => parseTypeAnnotation(p))
            .join(', ')
          return `${typeName}<${typeParams}>`
        }
        return typeName
      } else if (type.typeName.type === 'TSQualifiedName') {
        const typeName = getQualifiedNameName(type.typeName)
        if (type.typeParameters && type.typeParameters.params.length > 0) {
          const typeParams = type.typeParameters.params
            .map(p => parseTypeAnnotation(p))
            .join(', ')
          return `${typeName}<${typeParams}>`
        }
        return typeName
      }
      return UNKNOWN_TYPE
    case 'TSUnionType':
      return type.types.map(t => parseTypeAnnotation(t)).join(' | ')
    case 'TSIntersectionType':
      return type.types.map(t => parseTypeAnnotation(t)).join(' & ')
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
        .map(t => parseTypeAnnotation(t))
        .join(', ')}]`
    case 'TSParenthesizedType':
      return `(${parseTypeAnnotation(type.typeAnnotation)})`
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
      return `infer ${type.typeParameter.name}`
    case 'TSConditionalType':
      return `${parseTypeAnnotation(type.checkType)} extends ${parseTypeAnnotation(type.extendsType)} ? ${parseTypeAnnotation(type.trueType)} : ${parseTypeAnnotation(type.falseType)}`
    default:
      return UNKNOWN_TYPE
  }
}
