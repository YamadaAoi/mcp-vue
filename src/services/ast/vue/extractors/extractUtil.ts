import type { Position } from '../types'

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
