import type { Position } from '../types'
import type {
  Expression,
  Identifier,
  ObjectPattern,
  ArrayPattern,
  RestElement,
  AssignmentPattern,
  VoidPattern,
  LVal
} from '@babel/types'

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
