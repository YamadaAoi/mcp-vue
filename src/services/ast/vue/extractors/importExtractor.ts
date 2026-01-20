import type {
  Statement,
  ImportDefaultSpecifier,
  ImportNamespaceSpecifier,
  ImportSpecifier
} from '@babel/types'
import type { Position } from '../types'
import { getPositionFromNode, getEndPositionFromNode } from './extractUtil'

export interface ImportInfo {
  source: string
  importedNames: string[]
  isDefaultImport: boolean
  isNamespaceImport: boolean
  isTypeImport?: boolean
  startPosition?: Position
  endPosition?: Position
}

/**
 * 解析导入 specifier
 * @param specifier 导入 specifier
 * @param importedNames 导入名称数组
 * @param isDefaultImport 是否为默认导入
 * @param isNamespaceImport 是否为命名空间导入
 */
function parseImportSpecifier(
  specifier:
    | ImportDefaultSpecifier
    | ImportNamespaceSpecifier
    | ImportSpecifier,
  importedNames: string[],
  isDefaultImport: boolean,
  isNamespaceImport: boolean
): { isDefaultImport: boolean; isNamespaceImport: boolean } {
  if (specifier.type === 'ImportDefaultSpecifier') {
    importedNames.push(specifier.local.name)
    return { isDefaultImport: true, isNamespaceImport }
  } else if (specifier.type === 'ImportNamespaceSpecifier') {
    importedNames.push(specifier.local.name)
    return { isDefaultImport, isNamespaceImport: true }
  } else if (specifier.type === 'ImportSpecifier') {
    const importedName =
      specifier.imported.type === 'Identifier'
        ? specifier.imported.name
        : specifier.imported.value
    importedNames.push(importedName)
    return { isDefaultImport, isNamespaceImport }
  }
  return { isDefaultImport, isNamespaceImport }
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
      let isTypeImport = importNode.importKind === 'type'

      for (const specifier of importNode.specifiers) {
        const result = parseImportSpecifier(
          specifier,
          importedNames,
          isDefaultImport,
          isNamespaceImport
        )
        isDefaultImport = result.isDefaultImport
        isNamespaceImport = result.isNamespaceImport
      }

      imports.push({
        source,
        importedNames,
        isDefaultImport,
        isNamespaceImport,
        isTypeImport,
        startPosition: getPositionFromNode(importNode),
        endPosition: getEndPositionFromNode(importNode)
      })
    }
  }

  return imports
}
