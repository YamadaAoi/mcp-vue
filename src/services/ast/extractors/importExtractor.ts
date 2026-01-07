import type { ASTNode, ImportInfo } from '../types'
import { getLogger } from '../../../utils/logger'

const logger = getLogger()

const IMPORT_STATEMENT_NODE_TYPE = 'import_statement' as const
const STRING_NODE_TYPE = 'string' as const
const IMPORT_CLAUSE_NODE_TYPE = 'import_clause' as const
const IDENTIFIER_NODE_TYPE = 'identifier' as const
const NAMESPACE_IMPORT_NODE_TYPE = 'namespace_import' as const
const NAMED_IMPORTS_NODE_TYPE = 'named_imports' as const
const IMPORT_SPECIFIER_NODE_TYPE = 'import_specifier' as const
const TYPE_NODE_TYPE = 'type' as const

function isImportNodeType(
  nodeType: string
): nodeType is typeof IMPORT_STATEMENT_NODE_TYPE {
  return nodeType === IMPORT_STATEMENT_NODE_TYPE
}

export function extractImports(astNode: ASTNode): ImportInfo[] {
  const imports: ImportInfo[] = []
  const queue: ASTNode[] = [astNode]

  while (queue.length > 0) {
    const node = queue.shift()!

    try {
      if (isImportNodeType(node.type)) {
        const importInfo = parseImportInfo(node)
        if (importInfo) {
          imports.push(importInfo)
          logger.debug(
            `Extracted import: ${importInfo.source} (${importInfo.imports.join(', ')})`
          )
        }
      }

      queue.push(...node.children)
    } catch (error) {
      logger.error(
        `Failed to process node of type ${node.type}`,
        error instanceof Error ? error : String(error)
      )
    }
  }

  logger.info(`Extracted ${imports.length} imports`)
  return imports
}

function parseImportInfo(node: ASTNode): ImportInfo | null {
  try {
    const sourceNode = node.children.find(
      child => child.type === STRING_NODE_TYPE
    )
    const source = sourceNode?.text?.replace(/^['"]|['"]$/g, '') || ''

    const imports: string[] = []
    let isDefault = false
    let isNamespace = false
    let isTypeOnly = false
    let isSideEffect = false

    const importClause = node.children.find(
      child => child.type === IMPORT_CLAUSE_NODE_TYPE
    )

    if (!importClause) {
      isSideEffect = true
    } else {
      isTypeOnly = node.children.some(child => child.type === TYPE_NODE_TYPE)

      for (const clauseChild of importClause.children) {
        if (clauseChild.type === IDENTIFIER_NODE_TYPE) {
          imports.push(clauseChild.text.trim())
          isDefault = true
        } else if (clauseChild.type === NAMESPACE_IMPORT_NODE_TYPE) {
          const identifier = clauseChild.children.find(
            c => c.type === IDENTIFIER_NODE_TYPE
          )
          if (identifier) {
            imports.push(identifier.text.trim())
            isNamespace = true
          }
        } else if (clauseChild.type === NAMED_IMPORTS_NODE_TYPE) {
          const namedImports = extractNamedImports(clauseChild)
          imports.push(...namedImports)
        }
      }
    }

    return {
      source,
      imports,
      isDefault,
      isNamespace,
      isTypeOnly,
      isSideEffect,
      startPosition: node.startPosition
    }
  } catch (error) {
    logger.error(
      'Failed to parse import info',
      error instanceof Error ? error : String(error)
    )
    return null
  }
}

function extractNamedImports(namedImportsNode: ASTNode): string[] {
  const imports: string[] = []

  for (const namedImport of namedImportsNode.children) {
    if (namedImport.type === IDENTIFIER_NODE_TYPE) {
      imports.push(namedImport.text.trim())
    } else if (namedImport.type === IMPORT_SPECIFIER_NODE_TYPE) {
      const identifier = namedImport.children.find(
        c => c.type === IDENTIFIER_NODE_TYPE
      )
      if (identifier) {
        imports.push(identifier.text.trim())
      }
    }
  }

  return imports
}
