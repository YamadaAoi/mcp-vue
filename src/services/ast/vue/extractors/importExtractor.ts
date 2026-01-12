import type { Statement } from '@babel/types'
import type { Position } from '../types'

/**
 * 从节点获取位置信息的通用函数
 * @param node AST节点
 * @param positionType 位置类型 ('start' 或 'end')
 * @returns 位置信息对象
 */
function getLocationFromNode(
  node: {
    loc?:
      | {
          start?: { line?: number; column?: number }
          end?: { line?: number; column?: number }
        }
      | null
      | undefined
  },
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
export function getPositionFromNode(node: {
  loc?:
    | {
        start?: { line?: number; column?: number }
        end?: { line?: number; column?: number }
      }
    | null
    | undefined
}): Position {
  return getLocationFromNode(node, 'start')
}

/**
 * 从节点获取结束位置信息
 * @param node AST节点
 * @returns 结束位置信息
 */
export function getEndPositionFromNode(node: {
  loc?:
    | {
        start?: { line?: number; column?: number }
        end?: { line?: number; column?: number }
      }
    | null
    | undefined
}): Position {
  return getLocationFromNode(node, 'end')
}

/**
 * 导入信息类型定义
 */
export interface ImportInfo {
  source: string
  importedNames: string[]
  isDefaultImport: boolean
  isNamespaceImport: boolean
  startPosition: Position
  endPosition: Position
}

/**
 * 解析Vue组件中的导入语句
 * @param ast AST节点数组
 * @returns 解析后的导入信息数组
 */
export function extractImports(ast: Statement[]): ImportInfo[] {
  const imports: ImportInfo[] = []

  for (const node of ast) {
    if (node.type === 'ImportDeclaration') {
      const importNode = node
      const source = importNode.source.value
      const importedNames: string[] = []
      let isDefaultImport = false
      let isNamespaceImport = false

      for (const specifier of importNode.specifiers) {
        if (specifier.type === 'ImportDefaultSpecifier') {
          const defaultSpec = specifier
          isDefaultImport = true
          importedNames.push(defaultSpec.local.name)
        } else if (specifier.type === 'ImportNamespaceSpecifier') {
          const namespaceSpec = specifier
          isNamespaceImport = true
          importedNames.push(namespaceSpec.local.name)
        } else if (specifier.type === 'ImportSpecifier') {
          const importSpec = specifier
          const importedName =
            importSpec.imported.type === 'Identifier'
              ? importSpec.imported.name
              : importSpec.imported.value
          importedNames.push(importedName)
        }
      }

      imports.push({
        source,
        importedNames,
        isDefaultImport,
        isNamespaceImport,
        startPosition: getPositionFromNode(importNode),
        endPosition: getEndPositionFromNode(importNode)
      })
    }
  }

  return imports
}
