import type { Position } from '../types'
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
  Noop
} from '@babel/types'

// 类型常量
export const UNKNOWN_TYPE = 'unknown'
export const DEFAULT_PARAM_NAME = 'param'
export const TYPE_LITERAL_PLACEHOLDER = '{ ... }'

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
 * @param positionType 位置类型 ('start' 或 'end')
 * @returns 位置信息对象
 */
function getLocationFromNode(
  node: LocatableNode,
  positionType: 'start' | 'end'
): Position {
  const position = positionType === 'start' ? node?.loc?.start : node?.loc?.end
  return {
    row: position?.line || 0,
    column: position?.column || 0
  }
}

/**
 * 从节点获取位置信息
 * @param node AST节点
 * @returns 位置信息对象
 */
export function getPositionFromNode(node: LocatableNode): Position {
  return getLocationFromNode(node, 'start')
}

/**
 * 从节点获取结束位置信息
 * @param node AST节点
 * @returns 结束位置信息
 */
export function getEndPositionFromNode(node: LocatableNode): Position {
  return getLocationFromNode(node, 'end')
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
