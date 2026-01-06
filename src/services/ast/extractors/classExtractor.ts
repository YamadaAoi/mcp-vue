import type { ASTNode, ClassInfo, MethodInfo, PropertyInfo } from '../types'

export function extractClasses(astNode: ASTNode): ClassInfo[] {
  const classes: ClassInfo[] = []

  const extractFromNode = (node: ASTNode) => {
    if (node.type === 'class_declaration' || node.type === 'class_expression') {
      const classInfo = parseClassInfo(node)
      if (classInfo) {
        classes.push(classInfo)
      }
    }

    for (const child of node.children) {
      extractFromNode(child)
    }
  }

  extractFromNode(astNode)
  return classes
}

function parseClassInfo(node: ASTNode): ClassInfo | null {
  const nameNode = node.children.find(child => child.type === 'identifier')
  const extendsNode = node.children.find(
    child => child.type === 'class_heritage'
  )
  const bodyNode = node.children.find(child => child.type === 'class_body')

  const name = nameNode?.text || 'anonymous'
  const extendsClass = extendsNode?.children.find(
    c => c.type === 'identifier'
  )?.text

  const implementsInterfaces: string[] = []
  if (extendsNode) {
    for (const child of extendsNode.children) {
      if (child.type === 'implements_clause') {
        for (const implChild of child.children) {
          if (
            implChild.type === 'type_identifier' ||
            implChild.type === 'identifier'
          ) {
            implementsInterfaces.push(implChild.text)
          }
        }
      }
    }
  }

  const methods: MethodInfo[] = []
  const properties: PropertyInfo[] = []

  if (bodyNode) {
    for (const child of bodyNode.children) {
      if (child.type === 'method_definition') {
        const methodInfo = parseMethodInfo(child)
        if (methodInfo) {
          methods.push(methodInfo)
        }
      } else if (child.type === 'property_definition') {
        const propInfo = parsePropertyInfo(child)
        if (propInfo) {
          properties.push(propInfo)
        }
      }
    }
  }

  return {
    name,
    extends: extendsClass,
    implements:
      implementsInterfaces.length > 0 ? implementsInterfaces : undefined,
    methods,
    properties,
    startPosition: node.startPosition,
    endPosition: node.endPosition
  }
}

function parseMethodInfo(node: ASTNode): MethodInfo | null {
  const nameNode = node.children.find(
    child => child.type === 'property_identifier'
  )
  const parametersNode = node.children.find(
    child => child.type === 'formal_parameters'
  )
  const returnTypeNode = node.children.find(
    child => child.type === 'type_annotation'
  )
  const isStatic = node.children.some(child => child.type === 'static')
  const isAsync = node.children.some(child => child.type === 'async')

  if (!nameNode) return null

  const parameters = parametersNode ? extractParameters(parametersNode) : []
  const returnType = returnTypeNode
    ? extractTypeAnnotation(returnTypeNode)
    : undefined

  return {
    name: nameNode.text,
    parameters,
    returnType,
    isStatic,
    isAsync
  }
}

function parsePropertyInfo(node: ASTNode): PropertyInfo | null {
  const nameNode = node.children.find(
    child => child.type === 'property_identifier'
  )
  const typeAnnotationNode = node.children.find(
    child => child.type === 'type_annotation'
  )
  const isStatic = node.children.some(child => child.type === 'static')
  const visibility = node.children.find(
    child =>
      child.type === 'public' ||
      child.type === 'private' ||
      child.type === 'protected'
  )?.type as 'public' | 'private' | 'protected' | undefined

  if (!nameNode) return null

  const type = typeAnnotationNode
    ? extractTypeAnnotation(typeAnnotationNode)
    : undefined

  return {
    name: nameNode.text,
    type,
    isStatic,
    visibility
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
