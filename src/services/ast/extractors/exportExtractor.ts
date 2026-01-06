import type { ASTNode, ExportInfo } from '../types'

export function extractExports(astNode: ASTNode): ExportInfo[] {
  const exports: ExportInfo[] = []

  const extractFromNode = (node: ASTNode) => {
    if (node.type === 'export_statement') {
      const exportInfo = parseExportInfo(node)
      if (exportInfo) {
        exports.push(exportInfo)
      }
    }

    for (const child of node.children) {
      extractFromNode(child)
    }
  }

  extractFromNode(astNode)
  return exports
}

function parseExportInfo(node: ASTNode): ExportInfo | null {
  const isDefault = node.children.some(child => child.type === 'default')

  for (const child of node.children) {
    if (child.type === 'function_declaration') {
      const nameNode = child.children.find(c => c.type === 'identifier')
      if (nameNode) {
        return {
          name: nameNode.text,
          type: 'function',
          isDefault,
          startPosition: node.startPosition
        }
      }
    } else if (child.type === 'class_declaration') {
      const nameNode = child.children.find(c => c.type === 'identifier')
      if (nameNode) {
        return {
          name: nameNode.text,
          type: 'class',
          isDefault,
          startPosition: node.startPosition
        }
      }
    } else if (child.type === 'identifier') {
      return {
        name: child.text,
        type: 'variable',
        isDefault,
        startPosition: node.startPosition
      }
    }
  }

  return null
}
