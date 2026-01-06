import type { ASTNode, VariableInfo } from '../types'

export function extractVariables(astNode: ASTNode): VariableInfo[] {
  const variables: VariableInfo[] = []

  const extractFromNode = (node: ASTNode) => {
    if (
      node.type === 'lexical_declaration' ||
      node.type === 'variable_declaration'
    ) {
      const isConst = node.children.some(child => child.type === 'const')

      for (const child of node.children) {
        if (child.type === 'variable_declarator') {
          const nameNode = child.children.find(c => c.type === 'identifier')
          const typeAnnotationNode = child.children.find(
            c => c.type === 'type_annotation'
          )
          const valueNode = child.children.find(
            c =>
              c.type === 'expression_statement' ||
              c.type === 'assignment_expression' ||
              c.type === 'string' ||
              c.type === 'number' ||
              c.type === 'true' ||
              c.type === 'false' ||
              c.type === 'null' ||
              c.type === 'undefined' ||
              c.type === 'array' ||
              c.type === 'object' ||
              c.type === 'unary_expression' ||
              c.type === 'binary_expression' ||
              c.type === 'call_expression' ||
              c.type === 'new_expression' ||
              c.type === 'arrow_function' ||
              c.type === 'function_expression'
          )

          if (nameNode) {
            const type = typeAnnotationNode
              ? extractTypeAnnotation(typeAnnotationNode)
              : undefined

            let value: string | undefined
            if (valueNode) {
              if (valueNode.type === 'expression_statement') {
                const expression = valueNode.children[0]
                value = expression ? expression.text : undefined
              } else {
                value = valueNode.text
              }
            }

            variables.push({
              name: nameNode.text,
              type,
              value,
              isConst,
              startPosition: child.startPosition
            })
          }
        }
      }
    }

    for (const child of node.children) {
      extractFromNode(child)
    }
  }

  extractFromNode(astNode)
  return variables
}

function extractTypeAnnotation(node: ASTNode): string {
  if (node.type === 'type_annotation') {
    const typeNode = node.children.find(c => c.type !== ':')
    return typeNode ? typeNode.text : 'unknown'
  }
  return node.text
}
