import type { ASTNode, FunctionInfo } from '../types'
import { getLogger } from '../../../utils/logger'

const logger = getLogger()

const FUNCTION_DECLARATION_NODE_TYPE = 'function_declaration' as const
const FUNCTION_EXPRESSION_NODE_TYPE = 'function_expression' as const
const ARROW_FUNCTION_NODE_TYPE = 'arrow_function' as const
const METHOD_DEFINITION_NODE_TYPE = 'method_definition' as const
const IDENTIFIER_NODE_TYPE = 'identifier' as const
const FORMAL_PARAMETERS_NODE_TYPE = 'formal_parameters' as const
const TYPE_ANNOTATION_NODE_TYPE = 'type_annotation' as const
const REQUIRED_PARAMETER_NODE_TYPE = 'required_parameter' as const
const OPTIONAL_PARAMETER_NODE_TYPE = 'optional_parameter' as const
const ANONYMOUS_FUNCTION_NAME = 'anonymous' as const
const UNKNOWN_TYPE = 'unknown' as const

const FUNCTION_NODE_TYPES = [
  FUNCTION_DECLARATION_NODE_TYPE,
  FUNCTION_EXPRESSION_NODE_TYPE,
  ARROW_FUNCTION_NODE_TYPE,
  METHOD_DEFINITION_NODE_TYPE
] as const

function isFunctionNodeType(
  nodeType: string
): nodeType is (typeof FUNCTION_NODE_TYPES)[number] {
  return FUNCTION_NODE_TYPES.includes(
    nodeType as (typeof FUNCTION_NODE_TYPES)[number]
  )
}

export function extractFunctions(astNode: ASTNode): FunctionInfo[] {
  const functions: FunctionInfo[] = []
  const queue: ASTNode[] = [astNode]

  while (queue.length > 0) {
    const node = queue.shift()!

    try {
      if (isFunctionNodeType(node.type)) {
        const funcInfo = parseFunctionInfo(node)
        if (funcInfo) {
          functions.push(funcInfo)
          logger.debug(
            `Extracted function: ${funcInfo.name} (${funcInfo.type})`
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

  logger.info(`Extracted ${functions.length} functions`)
  return functions
}

function parseFunctionInfo(node: ASTNode): FunctionInfo | null {
  try {
    const nameNode = node.children.find(
      child => child.type === IDENTIFIER_NODE_TYPE
    )
    const parametersNode = node.children.find(
      child => child.type === FORMAL_PARAMETERS_NODE_TYPE
    )
    const returnTypeNode = node.children.find(
      child => child.type === TYPE_ANNOTATION_NODE_TYPE
    )

    const isAsync = node.children.some(child => child.type === 'async')
    const isGenerator = node.children.some(child => child.type === '*')

    const name = nameNode?.text || ANONYMOUS_FUNCTION_NAME
    const parameters = parametersNode ? extractParameters(parametersNode) : []
    const returnType = returnTypeNode
      ? extractTypeAnnotation(returnTypeNode)
      : undefined

    return {
      name,
      type: node.type,
      parameters,
      returnType,
      isAsync,
      isGenerator,
      startPosition: node.startPosition,
      endPosition: node.endPosition
    }
  } catch (error) {
    logger.error(
      'Failed to parse function info',
      error instanceof Error ? error : String(error)
    )
    return null
  }
}

function extractParameters(parametersNode: ASTNode): string[] {
  const parameters: string[] = []

  for (const child of parametersNode.children) {
    if (
      child.type === REQUIRED_PARAMETER_NODE_TYPE ||
      child.type === OPTIONAL_PARAMETER_NODE_TYPE
    ) {
      const identifier = child.children.find(
        c => c.type === IDENTIFIER_NODE_TYPE
      )
      if (identifier) {
        parameters.push(identifier.text)
      }
    }
  }

  return parameters
}

function extractTypeAnnotation(node: ASTNode): string {
  if (node.type === TYPE_ANNOTATION_NODE_TYPE) {
    const typeNode = node.children.find(c => c.type !== ':')
    return typeNode ? typeNode.text.trim() : UNKNOWN_TYPE
  }
  return node.text.trim()
}
