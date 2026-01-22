import type { Node } from 'web-tree-sitter'

/**
 * 从节点获取位置信息的通用函数
 * @param node AST节点
 * @returns 位置信息
 */
export function getLocationFromNode(
  node: Node
): [number, number, number, number] {
  return [
    node?.startPosition?.row || 0,
    node?.startPosition?.column || 0,
    node?.endPosition?.row || 0,
    node?.endPosition?.column || 0
  ]
}
