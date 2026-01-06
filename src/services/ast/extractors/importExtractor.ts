import type { ASTNode, ImportInfo } from '../types'

export function extractImports(astNode: ASTNode): ImportInfo[] {
  const imports: ImportInfo[] = []

  const extractFromNode = (node: ASTNode) => {
    if (node.type === 'import_statement') {
      const importInfo = parseImportInfo(node)
      if (importInfo) {
        imports.push(importInfo)
      }
    }

    for (const child of node.children) {
      extractFromNode(child)
    }
  }

  extractFromNode(astNode)
  return imports
}

function parseImportInfo(node: ASTNode): ImportInfo | null {
  const sourceNode = node.children.find(child => child.type === 'string')
  const source = sourceNode?.text?.replace(/['"]/g, '') || ''

  const imports: string[] = []
  let isDefault = false
  let isNamespace = false

  for (const child of node.children) {
    if (child.type === 'import_clause') {
      for (const clauseChild of child.children) {
        if (clauseChild.type === 'identifier') {
          imports.push(clauseChild.text)
          isDefault = true
        } else if (clauseChild.type === 'namespace_import') {
          const identifier = clauseChild.children.find(
            c => c.type === 'identifier'
          )
          if (identifier) {
            imports.push(identifier.text)
            isNamespace = true
          }
        } else if (clauseChild.type === 'named_imports') {
          for (const namedImport of clauseChild.children) {
            if (namedImport.type === 'identifier') {
              imports.push(namedImport.text)
            } else if (namedImport.type === 'import_specifier') {
              const identifier = namedImport.children.find(
                c => c.type === 'identifier'
              )
              if (identifier) {
                imports.push(identifier.text)
              }
            }
          }
        }
      }
    }
  }

  return {
    source,
    imports,
    isDefault,
    isNamespace,
    startPosition: node.startPosition
  }
}
