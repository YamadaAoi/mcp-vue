import type { ASTNode, TypeInfo, TypePropertyInfo, MethodInfo } from '../types'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

const INTERFACE_DECLARATION_NODE_TYPE = 'interface_declaration' as const
const TYPE_ALIAS_DECLARATION_NODE_TYPE = 'type_alias_declaration' as const
const ENUM_DECLARATION_NODE_TYPE = 'enum_declaration' as const
const TYPE_IDENTIFIER_NODE_TYPE = 'type_identifier' as const
const INTERFACE_BODY_NODE_TYPE = 'interface_body' as const
const PROPERTY_SIGNATURE_NODE_TYPE = 'property_signature' as const
const METHOD_SIGNATURE_NODE_TYPE = 'method_signature' as const
const PROPERTY_IDENTIFIER_NODE_TYPE = 'property_identifier' as const
const TYPE_ANNOTATION_NODE_TYPE = 'type_annotation' as const
const FORMAL_PARAMETERS_NODE_TYPE = 'formal_parameters' as const
const REQUIRED_PARAMETER_NODE_TYPE = 'required_parameter' as const
const OPTIONAL_PARAMETER_NODE_TYPE = 'optional_parameter' as const
const IDENTIFIER_NODE_TYPE = 'identifier' as const
const TYPE_PARAMETERS_NODE_TYPE = 'type_parameters' as const
const EXTENDS_NODE_TYPE = 'extends' as const
const TYPE_PARAMETER_NODE_TYPE = 'type_parameter' as const
const ENUM_BODY_NODE_TYPE = 'enum_body' as const
const UNKNOWN_TYPE = 'unknown' as const

const TYPE_DECLARATION_NODE_TYPES = [
  INTERFACE_DECLARATION_NODE_TYPE,
  TYPE_ALIAS_DECLARATION_NODE_TYPE,
  ENUM_DECLARATION_NODE_TYPE
] as const

function isTypeDeclarationNodeType(
  nodeType: string
): nodeType is (typeof TYPE_DECLARATION_NODE_TYPES)[number] {
  return TYPE_DECLARATION_NODE_TYPES.includes(
    nodeType as (typeof TYPE_DECLARATION_NODE_TYPES)[number]
  )
}

export function extractTypes(astNode: ASTNode): TypeInfo[] {
  const types: TypeInfo[] = []
  const queue: Array<{ node: ASTNode; parent?: ASTNode }> = [{ node: astNode }]

  while (queue.length > 0) {
    const { node, parent } = queue.shift()!

    try {
      if (isTypeDeclarationNodeType(node.type)) {
        // 只提取顶层类型定义，即直接位于program节点下的类型定义
        const isTopLevel = parent?.type === 'program'

        if (isTopLevel) {
          const typeInfo = parseTypeInfo(node)
          if (typeInfo) {
            types.push(typeInfo)
            logger.debug(`Extracted type: ${typeInfo.name} (${typeInfo.kind})`)
          }
        } else {
          logger.debug(
            `Skipped non-top-level type at line ${node.position.toString()}`
          )
        }
      }

      for (const child of node.children) {
        queue.push({ node: child, parent: node })
      }
    } catch (error) {
      logger.error(
        `Failed to process node of type ${node.type}`,
        error instanceof Error ? error : String(error)
      )
    }
  }

  logger.info(`Extracted ${types.length} types`)
  return types
}

function parseTypeInfo(node: ASTNode): TypeInfo | null {
  if (node.type === INTERFACE_DECLARATION_NODE_TYPE) {
    return parseInterfaceInfo(node)
  } else if (node.type === TYPE_ALIAS_DECLARATION_NODE_TYPE) {
    return parseTypeAliasInfo(node)
  } else if (node.type === ENUM_DECLARATION_NODE_TYPE) {
    return parseEnumInfo(node)
  }
  return null
}

function parseInterfaceInfo(node: ASTNode): TypeInfo | null {
  try {
    const nameNode = node.children.find(
      child => child.type === TYPE_IDENTIFIER_NODE_TYPE
    )
    const bodyNode = node.children.find(
      child => child.type === INTERFACE_BODY_NODE_TYPE
    )
    const typeParametersNode = node.children.find(
      child => child.type === TYPE_PARAMETERS_NODE_TYPE
    )
    const extendsNode = node.children.find(
      child => child.type === EXTENDS_NODE_TYPE
    )

    if (!nameNode) return null

    const typeParameters = typeParametersNode
      ? extractTypeParameters(typeParametersNode)
      : undefined
    const extendsTypes = extendsNode
      ? extractExtendsTypes(extendsNode)
      : undefined

    const properties: TypePropertyInfo[] = []
    const methods: MethodInfo[] = []

    if (bodyNode) {
      for (const child of bodyNode.children) {
        if (child.type === PROPERTY_SIGNATURE_NODE_TYPE) {
          const propInfo = parseTypePropertyInfo(child)
          if (propInfo) {
            properties.push(propInfo)
          }
        } else if (child.type === METHOD_SIGNATURE_NODE_TYPE) {
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
      typeParameters,
      extends: extendsTypes,
      position: node.position
    }
  } catch (error) {
    logger.error(
      'Failed to parse interface info',
      error instanceof Error ? error : String(error)
    )
    return null
  }
}

function parseTypeAliasInfo(node: ASTNode): TypeInfo | null {
  try {
    const nameNode = node.children.find(
      child => child.type === TYPE_IDENTIFIER_NODE_TYPE
    )
    const typeParametersNode = node.children.find(
      child => child.type === TYPE_PARAMETERS_NODE_TYPE
    )
    const typeBodyNode = node.children.find(
      child =>
        child.type !== TYPE_IDENTIFIER_NODE_TYPE &&
        child.type !== TYPE_ANNOTATION_NODE_TYPE &&
        child.type !== '='
    )

    if (!nameNode) return null

    const typeParameters = typeParametersNode
      ? extractTypeParameters(typeParametersNode)
      : undefined
    const typeBody = typeBodyNode ? typeBodyNode.text.trim() : undefined

    return {
      name: nameNode.text,
      kind: 'type',
      properties: [],
      methods: [],
      typeParameters,
      typeBody,
      position: node.position
    }
  } catch (error) {
    logger.error(
      'Failed to parse type alias info',
      error instanceof Error ? error : String(error)
    )
    return null
  }
}

function parseEnumInfo(node: ASTNode): TypeInfo | null {
  try {
    const nameNode = node.children.find(
      child => child.type === IDENTIFIER_NODE_TYPE
    )
    const bodyNode = node.children.find(
      child => child.type === ENUM_BODY_NODE_TYPE
    )

    if (!nameNode) return null

    const enumMembers = bodyNode ? extractEnumMembers(bodyNode) : []

    return {
      name: nameNode.text,
      kind: 'enum',
      properties: [],
      methods: [],
      enumMembers,
      position: node.position
    }
  } catch (error) {
    logger.error(
      'Failed to parse enum info',
      error instanceof Error ? error : String(error)
    )
    return null
  }
}

function parseTypePropertyInfo(node: ASTNode): TypePropertyInfo | null {
  try {
    const nameNode = node.children.find(
      child => child.type === PROPERTY_IDENTIFIER_NODE_TYPE
    )
    const typeAnnotationNode = node.children.find(
      child => child.type === TYPE_ANNOTATION_NODE_TYPE
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
  } catch (error) {
    logger.error(
      'Failed to parse type property info',
      error instanceof Error ? error : String(error)
    )
    return null
  }
}

function parseMethodSignatureInfo(node: ASTNode): MethodInfo | null {
  try {
    const nameNode = node.children.find(
      child => child.type === PROPERTY_IDENTIFIER_NODE_TYPE
    )
    const parametersNode = node.children.find(
      child => child.type === FORMAL_PARAMETERS_NODE_TYPE
    )
    const returnTypeNode = node.children.find(
      child => child.type === TYPE_ANNOTATION_NODE_TYPE
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
      isAsync: false,
      isAbstract: false
    }
  } catch (error) {
    logger.error(
      'Failed to parse method signature info',
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
        parameters.push(identifier.text.trim())
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

function extractTypeParameters(typeParametersNode: ASTNode): string[] {
  const parameters: string[] = []

  for (const child of typeParametersNode.children) {
    if (child.type === TYPE_PARAMETER_NODE_TYPE) {
      const identifier = child.children.find(
        c => c.type === IDENTIFIER_NODE_TYPE
      )
      if (identifier) {
        parameters.push(identifier.text.trim())
      }
    }
  }

  return parameters
}

function extractExtendsTypes(extendsNode: ASTNode): string[] {
  const types: string[] = []

  for (const child of extendsNode.children) {
    if (child.type === TYPE_IDENTIFIER_NODE_TYPE) {
      types.push(child.text.trim())
    }
  }

  return types
}

function extractEnumMembers(enumBodyNode: ASTNode): string[] {
  const members: string[] = []

  for (const child of enumBodyNode.children) {
    if (child.type === PROPERTY_IDENTIFIER_NODE_TYPE) {
      members.push(child.text.trim())
    }
  }

  return members
}
