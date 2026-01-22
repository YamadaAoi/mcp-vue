import type { ASTNode, FunctionCallInfo } from '../types'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

const CALL_EXPRESSION_NODE_TYPE = 'call_expression' as const
const IDENTIFIER_NODE_TYPE = 'identifier' as const
const MEMBER_EXPRESSION_NODE_TYPE = 'member_expression' as const
const PROPERTY_IDENTIFIER_NODE_TYPE = 'property_identifier' as const
const ARGUMENTS_NODE_TYPE = 'arguments' as const

const TOP_LEVEL_PARENT_TYPES = new Set([
  'program',
  'export_statement',
  'lexical_declaration',
  'expression_statement'
])

const EXCLUDED_PARENT_TYPES = new Set([
  CALL_EXPRESSION_NODE_TYPE,
  'function_declaration',
  'function_expression',
  'arrow_function',
  'method_definition'
])

const EXCLUDED_ARGUMENT_TYPES = new Set([',', '(', ')'])

function isTopLevelCallExpression(
  node: ASTNode,
  parentChain: ASTNode[]
): boolean {
  if (node.type !== CALL_EXPRESSION_NODE_TYPE) {
    return false
  }

  if (parentChain.length === 0) {
    return true
  }

  const directParent = parentChain[parentChain.length - 1]

  if (!TOP_LEVEL_PARENT_TYPES.has(directParent.type)) {
    return false
  }

  return !parentChain.some(parent => EXCLUDED_PARENT_TYPES.has(parent.type))
}

function extractFunctionCallName(node: ASTNode): string | null {
  const functionNode = node.children[0]

  if (!functionNode) {
    return null
  }

  if (functionNode.type === IDENTIFIER_NODE_TYPE) {
    return functionNode.text
  }

  if (functionNode.type === MEMBER_EXPRESSION_NODE_TYPE) {
    const propertyIdentifier = functionNode.children.find(
      child => child.type === PROPERTY_IDENTIFIER_NODE_TYPE
    )
    if (propertyIdentifier) {
      return propertyIdentifier.text
    }
  }

  return null
}

function extractArguments(node: ASTNode): string[] {
  const argumentsNode = node.children.find(
    child => child.type === ARGUMENTS_NODE_TYPE
  )

  if (!argumentsNode) {
    return []
  }

  return argumentsNode.children
    .filter(child => !EXCLUDED_ARGUMENT_TYPES.has(child.type))
    .map(child => child.text.trim())
}

export function extractFunctionCalls(astNode: ASTNode): FunctionCallInfo[] {
  const functionCalls: FunctionCallInfo[] = []
  const queue: Array<{ node: ASTNode; parentChain: ASTNode[] }> = [
    { node: astNode, parentChain: [] }
  ]

  logger.debug('Starting function call extraction')

  while (queue.length > 0) {
    const { node, parentChain } = queue.shift()!

    try {
      if (isTopLevelCallExpression(node, parentChain)) {
        const name = extractFunctionCallName(node)

        if (name) {
          const callInfo: FunctionCallInfo = {
            name,
            arguments: extractArguments(node),
            position: node.position
          }

          functionCalls.push(callInfo)

          logger.debug(
            `Extracted function call: ${name} at line ${node.position.toString()}`
          )
        }
      }

      for (const child of node.children) {
        queue.push({ node: child, parentChain: [...parentChain, node] })
      }
    } catch (error) {
      logger.error(
        `Failed to process node of type ${node.type}`,
        error instanceof Error ? error : String(error)
      )
    }
  }

  logger.info(`Extracted ${functionCalls.length} function calls`)
  return functionCalls
}
