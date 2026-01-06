import type { ASTNode, TypeInfo, TypePropertyInfo, MethodInfo } from '../types'

export function extractTypes(astNode: ASTNode): TypeInfo[] {
  const types: TypeInfo[] = []

  const extractFromNode = (node: ASTNode) => {
    if (node.type === 'interface_declaration') {
      const typeInfo = parseInterfaceInfo(node)
      if (typeInfo) {
        types.push(typeInfo)
      }
    } else if (node.type === 'type_alias_declaration') {
      const typeInfo = parseTypeAliasInfo(node)
      if (typeInfo) {
        types.push(typeInfo)
      }
    } else if (node.type === 'enum_declaration') {
      const typeInfo = parseEnumInfo(node)
      if (typeInfo) {
        types.push(typeInfo)
      }
    }

    for (const child of node.children) {
      extractFromNode(child)
    }
  }

  extractFromNode(astNode)
  return types
}

function parseInterfaceInfo(node: ASTNode): TypeInfo | null {
  const nameNode = node.children.find(child => child.type === 'type_identifier')
  const bodyNode = node.children.find(child => child.type === 'interface_body')

  if (!nameNode) return null

  const properties: TypePropertyInfo[] = []
  const methods: MethodInfo[] = []

  if (bodyNode) {
    for (const child of bodyNode.children) {
      if (child.type === 'property_signature') {
        const propInfo = parseTypePropertyInfo(child)
        if (propInfo) {
          properties.push(propInfo)
        }
      } else if (child.type === 'method_signature') {
        const methodInfo = parseMethodSignatureInfo(child)
        if (methodInfo) {
          methods.push(methodInfo)
        }
      }
    }
  }

  return {
    name: nameNode.text,
    kind: 'interface',
    properties,
    methods,
    startPosition: node.startPosition,
    endPosition: node.endPosition
  }
}

function parseTypeAliasInfo(node: ASTNode): TypeInfo | null {
  const nameNode = node.children.find(child => child.type === 'type_identifier')

  if (!nameNode) return null

  return {
    name: nameNode.text,
    kind: 'type',
    properties: [],
    methods: [],
    startPosition: node.startPosition,
    endPosition: node.endPosition
  }
}

function parseEnumInfo(node: ASTNode): TypeInfo | null {
  const nameNode = node.children.find(child => child.type === 'identifier')

  if (!nameNode) return null

  return {
    name: nameNode.text,
    kind: 'enum',
    properties: [],
    methods: [],
    startPosition: node.startPosition,
    endPosition: node.endPosition
  }
}

function parseTypePropertyInfo(node: ASTNode): TypePropertyInfo | null {
  const nameNode = node.children.find(
    child => child.type === 'property_identifier'
  )
  const typeAnnotationNode = node.children.find(
    child => child.type === 'type_annotation'
  )
  const isOptional = node.children.some(child => child.type === '?')
  const isReadonly = node.children.some(child => child.type === 'readonly')

  if (!nameNode) return null

  const type = typeAnnotationNode
    ? extractTypeAnnotation(typeAnnotationNode)
    : undefined

  return {
    name: nameNode.text,
    type,
    isOptional,
    isReadonly
  }
}

function parseMethodSignatureInfo(node: ASTNode): MethodInfo | null {
  const nameNode = node.children.find(
    child => child.type === 'property_identifier'
  )
  const parametersNode = node.children.find(
    child => child.type === 'formal_parameters'
  )
  const returnTypeNode = node.children.find(
    child => child.type === 'type_annotation'
  )

  if (!nameNode) return null

  const parameters = parametersNode ? extractParameters(parametersNode) : []
  const returnType = returnTypeNode
    ? extractTypeAnnotation(returnTypeNode)
    : undefined

  return {
    name: nameNode.text,
    parameters,
    returnType,
    isStatic: false,
    isAsync: false
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
