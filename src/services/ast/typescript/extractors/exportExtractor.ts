import type { ASTNode, ExportInfo } from '../types'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

const EXPORT_NODE_TYPE = 'export_statement' as const
const FUNCTION_DECLARATION_NODE_TYPE = 'function_declaration' as const
const CLASS_DECLARATION_NODE_TYPE = 'class_declaration' as const
const TYPE_ALIAS_DECLARATION_NODE_TYPE = 'type_alias_declaration' as const
const INTERFACE_DECLARATION_NODE_TYPE = 'interface_declaration' as const
const ENUM_DECLARATION_NODE_TYPE = 'enum_declaration' as const
const IDENTIFIER_NODE_TYPE = 'identifier' as const
const TYPE_IDENTIFIER_NODE_TYPE = 'type_identifier' as const
const DEFAULT_KEYWORD = 'default' as const

const EXPORT_TYPE_MAPPING = {
  [FUNCTION_DECLARATION_NODE_TYPE]: 'function' as const,
  [CLASS_DECLARATION_NODE_TYPE]: 'class' as const,
  [TYPE_ALIAS_DECLARATION_NODE_TYPE]: 'type' as const,
  [INTERFACE_DECLARATION_NODE_TYPE]: 'type' as const,
  [ENUM_DECLARATION_NODE_TYPE]: 'type' as const,
  lexical_declaration: 'variable' as const
} as const

function isExportNodeType(
  nodeType: string
): nodeType is typeof EXPORT_NODE_TYPE {
  return nodeType === EXPORT_NODE_TYPE
}

function findChildByType(node: ASTNode, nodeType: string): ASTNode | undefined {
  return node.children.find(child => child.type === nodeType)
}

function hasChildByType(node: ASTNode, nodeType: string): boolean {
  return node.children.some(child => child.type === nodeType)
}

export function extractExports(astNode: ASTNode): ExportInfo[] {
  const exports: ExportInfo[] = []
  const queue: ASTNode[] = [astNode]

  while (queue.length > 0) {
    const node = queue.shift()!

    try {
      if (isExportNodeType(node.type)) {
        const exportInfo = parseExportInfo(node)
        if (exportInfo) {
          exports.push(exportInfo)
          logger.debug(
            `Extracted export: ${exportInfo.name} (${exportInfo.type})`
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

  logger.info(`Extracted ${exports.length} exports`)
  return exports
}

function parseExportInfo(node: ASTNode): ExportInfo | null {
  try {
    const isDefault = hasChildByType(node, DEFAULT_KEYWORD)

    for (const child of node.children) {
      const exportType =
        EXPORT_TYPE_MAPPING[child.type as keyof typeof EXPORT_TYPE_MAPPING]

      if (exportType) {
        if (
          child.type === TYPE_ALIAS_DECLARATION_NODE_TYPE ||
          child.type === INTERFACE_DECLARATION_NODE_TYPE ||
          child.type === ENUM_DECLARATION_NODE_TYPE
        ) {
          const nameNode =
            findChildByType(child, TYPE_IDENTIFIER_NODE_TYPE) ||
            findChildByType(child, IDENTIFIER_NODE_TYPE)
          if (nameNode) {
            return {
              name: nameNode.text,
              type: exportType,
              isDefault,
              position: node.position
            }
          }
        } else if (child.type === 'lexical_declaration') {
          const variableDeclarator = child.children.find(
            c => c.type === 'variable_declarator'
          )
          if (variableDeclarator) {
            const nameNode = findChildByType(
              variableDeclarator,
              IDENTIFIER_NODE_TYPE
            )
            if (nameNode) {
              return {
                name: nameNode.text,
                type: exportType,
                isDefault,
                position: node.position
              }
            }
          }
        } else {
          const result = extractNameAndPosition(child)
          if (result) {
            return {
              ...result,
              type: exportType,
              isDefault,
              position: node.position
            }
          }
        }
      } else if (child.type === IDENTIFIER_NODE_TYPE) {
        return {
          name: child.text,
          type: 'variable' as const,
          isDefault,
          position: child.position
        }
      }
    }

    logger.warn('Export statement missing name identifier')
    return null
  } catch (error) {
    logger.error(
      'Failed to parse export info',
      error instanceof Error ? error : String(error)
    )
    return null
  }
}

function extractNameAndPosition(node: ASTNode): { name: string } | null {
  const nameNode = findChildByType(node, IDENTIFIER_NODE_TYPE)
  if (nameNode) {
    return {
      name: nameNode.text
    }
  }
  return null
}
