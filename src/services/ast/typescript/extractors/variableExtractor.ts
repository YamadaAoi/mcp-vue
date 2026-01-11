import type { ASTNode, VariableInfo } from '../types'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

const VARIABLE_DECLARATION_TYPES = [
  'lexical_declaration',
  'variable_declaration'
] as const
const VALUE_NODE_TYPES = [
  'expression_statement',
  'assignment_expression',
  'string',
  'number',
  'true',
  'false',
  'null',
  'undefined',
  'array',
  'object',
  'unary_expression',
  'binary_expression',
  'call_expression',
  'new_expression',
  'arrow_function',
  'function_expression'
] as const

function isVariableDeclarationNode(node: ASTNode): boolean {
  return VARIABLE_DECLARATION_TYPES.includes(
    node.type as (typeof VARIABLE_DECLARATION_TYPES)[number]
  )
}

function isValueNode(node: ASTNode): boolean {
  return VALUE_NODE_TYPES.includes(
    node.type as (typeof VALUE_NODE_TYPES)[number]
  )
}

function extractTypeAnnotation(node: ASTNode): string {
  if (node.type === 'type_annotation') {
    const typeNode = node.children.find(c => c.type !== ':')
    return typeNode ? typeNode.text : 'unknown'
  }
  return node.text
}

function extractValueFromNode(node: ASTNode): string | undefined {
  if (node.type === 'expression_statement') {
    const expression = node.children[0]
    return expression ? expression.text : undefined
  }
  return node.text
}

function extractDecorators(node: ASTNode): string[] {
  const decorators: string[] = []
  for (const child of node.children) {
    if (child.type === 'decorator') {
      decorators.push(child.text)
    }
  }
  return decorators
}

function checkIsExported(node: ASTNode): boolean {
  return node.children.some(child => child.type === 'export')
}

function determineScope(node: ASTNode): 'local' | 'module' | 'global' {
  if (checkIsExported(node)) {
    return 'module'
  }
  return 'local'
}

export function extractVariables(astNode: ASTNode): VariableInfo[] {
  const variables: VariableInfo[] = []
  const stack: ASTNode[] = [astNode]

  while (stack.length > 0) {
    const node = stack.pop()
    if (!node) continue

    try {
      if (isVariableDeclarationNode(node)) {
        const isConst = node.children.some(child => child.type === 'const')
        const isReadonly = node.children.some(
          child => child.type === 'readonly'
        )
        const isExported = checkIsExported(node)
        const scope = determineScope(node)
        const decorators = extractDecorators(node)

        for (const child of node.children) {
          if (child.type === 'variable_declarator') {
            try {
              const nameNode = child.children.find(c => c.type === 'identifier')
              const typeAnnotationNode = child.children.find(
                c => c.type === 'type_annotation'
              )
              const valueNode = child.children.find(c => isValueNode(c))

              if (nameNode) {
                const type = typeAnnotationNode
                  ? extractTypeAnnotation(typeAnnotationNode)
                  : undefined

                const value = valueNode
                  ? extractValueFromNode(valueNode)
                  : undefined

                variables.push({
                  name: nameNode.text,
                  type,
                  value,
                  isConst,
                  isReadonly,
                  isExported,
                  scope,
                  decorators,
                  startPosition: child.startPosition
                })
              }
            } catch (error) {
              logger.error(
                `Error processing variable declarator: ${String(error)}`
              )
            }
          }
        }
      }

      for (const child of node.children) {
        stack.push(child)
      }
    } catch (error) {
      logger.error(
        `Error processing node of type ${node.type}: ${String(error)}`
      )
    }
  }

  return variables
}
