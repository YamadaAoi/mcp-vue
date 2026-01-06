import type { ASTNode, FunctionInfo } from '../types'

export function extractFunctions(astNode: ASTNode): FunctionInfo[] {
  const functions: FunctionInfo[] = []

  const extractFromNode = (node: ASTNode) => {
    if (
      node.type === 'function_declaration' ||
      node.type === 'function_expression' ||
      node.type === 'arrow_function' ||
      node.type === 'method_definition'
    ) {
      const funcInfo = parseFunctionInfo(node)
      if (funcInfo) {
        functions.push(funcInfo)
      }
    }

    for (const child of node.children) {
      extractFromNode(child)
    }
  }

  extractFromNode(astNode)
  return functions
}

function parseFunctionInfo(node: ASTNode): FunctionInfo | null {
  const nameNode = node.children.find(child => child.type === 'identifier')
  const parametersNode = node.children.find(
    child => child.type === 'formal_parameters'
  )
  const returnTypeNode = node.children.find(
    child => child.type === 'type_annotation'
  )

  const name = nameNode?.text || 'anonymous'
  const parameters = parametersNode ? extractParameters(parametersNode) : []
  const returnType = returnTypeNode
    ? extractTypeAnnotation(returnTypeNode)
    : undefined

  return {
    name,
    type: node.type,
    parameters,
    returnType,
    startPosition: node.startPosition,
    endPosition: node.endPosition
  }
}

function extractParameters(parametersNode: ASTNode): string[] {
  const parameters: string[] = []

  for (const child of parametersNode.children) {
    if (
      child.type === 'required_parameter' ||
      child.type === 'optional_parameter'
    ) {
      const identifier = child.children.find(c => c.type === 'identifier')
      if (identifier) {
        parameters.push(identifier.text)
      }
    }
  }

  return parameters
}

function extractTypeAnnotation(node: ASTNode): string {
  if (node.type === 'type_annotation') {
    const typeNode = node.children.find(c => c.type !== ':')
    return typeNode ? typeNode.text : 'unknown'
  }
  return node.text
}
