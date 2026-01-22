import type {
  ASTNode,
  ClassInfo,
  MethodInfo,
  PropertyInfo,
  AccessorInfo
} from '../types'
import { getLogger } from '../../../../utils/logger'

const logger = getLogger()

const CLASS_NODE_TYPES = [
  'class_declaration',
  'class_expression',
  'abstract_class_declaration'
] as const
const METHOD_NODE_TYPE = 'method_definition' as const
const PROPERTY_NODE_TYPE = 'public_field_definition' as const
const ACCESSOR_NODE_TYPE = 'accessor_declaration' as const
const IDENTIFIER_NODE_TYPE = 'identifier' as const
const PROPERTY_IDENTIFIER_NODE_TYPE = 'property_identifier' as const
const TYPE_IDENTIFIER_NODE_TYPE = 'type_identifier' as const
const TYPE_ANNOTATION_NODE_TYPE = 'type_annotation' as const
const FORMAL_PARAMETERS_NODE_TYPE = 'formal_parameters' as const
const TYPE_PARAMETERS_NODE_TYPE = 'type_parameters' as const
const CLASS_HERITAGE_NODE_TYPE = 'class_heritage' as const
const CLASS_BODY_NODE_TYPE = 'class_body' as const
const DECORATOR_NODE_TYPE = 'decorator' as const
const CALL_EXPRESSION_NODE_TYPE = 'call_expression' as const
const TYPE_PARAMETER_NODE_TYPE = 'type_parameter' as const
const REQUIRED_PARAMETER_NODE_TYPE = 'required_parameter' as const
const OPTIONAL_PARAMETER_NODE_TYPE = 'optional_parameter' as const
const IMPLEMENTS_CLAUSE_NODE_TYPE = 'implements_clause' as const

const VISIBILITY_MODIFIERS = ['public', 'private', 'protected'] as const

type ClassNodeType = (typeof CLASS_NODE_TYPES)[number]
type VisibilityModifier = (typeof VISIBILITY_MODIFIERS)[number]

function isClassNodeType(nodeType: string): nodeType is ClassNodeType {
  return CLASS_NODE_TYPES.includes(nodeType as ClassNodeType)
}

function isValidVisibilityModifier(
  modifier: string
): modifier is VisibilityModifier {
  return VISIBILITY_MODIFIERS.includes(modifier as VisibilityModifier)
}

function findChildByType(node: ASTNode, nodeType: string): ASTNode | undefined {
  return node.children.find(child => child.type === nodeType)
}

function findChildrenByType(node: ASTNode, nodeType: string): ASTNode[] {
  return node.children.filter(child => child.type === nodeType)
}

function hasChildByType(node: ASTNode, nodeType: string): boolean {
  return node.children.some(child => child.type === nodeType)
}

export function extractClasses(astNode: ASTNode): ClassInfo[] {
  const classes: ClassInfo[] = []
  const queue: ASTNode[] = [astNode]

  while (queue.length > 0) {
    const node = queue.shift()!

    try {
      if (isClassNodeType(node.type)) {
        const classInfo = parseClassInfo(node)
        if (classInfo) {
          classes.push(classInfo)
          logger.debug(`Extracted class: ${classInfo.name}`)
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

  logger.info(`Extracted ${classes.length} classes`)
  return classes
}

function parseClassInfo(node: ASTNode): ClassInfo | null {
  try {
    const nameNode =
      findChildByType(node, TYPE_IDENTIFIER_NODE_TYPE) ||
      findChildByType(node, IDENTIFIER_NODE_TYPE)
    if (!nameNode) {
      logger.warn('Class declaration missing name identifier')
      return null
    }

    const name = nameNode.text
    const extendsNode = findChildByType(node, CLASS_HERITAGE_NODE_TYPE)
    const bodyNode = findChildByType(node, CLASS_BODY_NODE_TYPE)
    const typeParametersNode = findChildByType(node, TYPE_PARAMETERS_NODE_TYPE)

    const extendsClass = extendsNode?.children.find(
      c => c.type === IDENTIFIER_NODE_TYPE
    )?.text
    const typeParameters = typeParametersNode
      ? extractTypeParameters(typeParametersNode)
      : undefined
    const decorators = extractDecorators(node)
    const isAbstract = hasChildByType(node, 'abstract')

    const implementsInterfaces: string[] = []
    if (extendsNode) {
      for (const child of extendsNode.children) {
        if (child.type === IMPLEMENTS_CLAUSE_NODE_TYPE) {
          for (const implChild of child.children) {
            if (
              implChild.type === TYPE_IDENTIFIER_NODE_TYPE ||
              implChild.type === IDENTIFIER_NODE_TYPE
            ) {
              implementsInterfaces.push(implChild.text)
            }
          }
        }
      }
    }

    const methods: MethodInfo[] = []
    const properties: PropertyInfo[] = []
    const accessors: AccessorInfo[] = []

    if (bodyNode) {
      for (const child of bodyNode.children) {
        try {
          if (child.type === METHOD_NODE_TYPE) {
            const methodInfo = parseMethodInfo(child)
            if (methodInfo) {
              methods.push(methodInfo)
            }
          } else if (child.type === PROPERTY_NODE_TYPE) {
            const propInfo = parsePropertyInfo(child)
            if (propInfo) {
              properties.push(propInfo)
            }
          } else if (child.type === ACCESSOR_NODE_TYPE) {
            const accessorInfo = parseAccessorInfo(child)
            if (accessorInfo) {
              accessors.push(accessorInfo)
            }
          }
        } catch (error) {
          logger.error(
            `Failed to parse class member in ${name}`,
            error instanceof Error ? error : String(error)
          )
        }
      }
    }

    const classInfo: ClassInfo = {
      name,
      extends: extendsClass,
      implements:
        implementsInterfaces.length > 0 ? implementsInterfaces : undefined,
      typeParameters,
      decorators: decorators.length > 0 ? decorators : undefined,
      isAbstract,
      methods,
      properties,
      accessors: accessors.length > 0 ? accessors : undefined,
      position: node.position
    }

    return classInfo
  } catch (error) {
    logger.error(
      `Failed to parse class info`,
      error instanceof Error ? error : String(error)
    )
    return null
  }
}

function parseMethodInfo(node: ASTNode): MethodInfo | null {
  try {
    const nameNode = findChildByType(node, PROPERTY_IDENTIFIER_NODE_TYPE)
    if (!nameNode) {
      logger.warn('Method definition missing name identifier')
      return null
    }

    const parametersNode = findChildByType(node, FORMAL_PARAMETERS_NODE_TYPE)
    const returnTypeNode = findChildByType(node, TYPE_ANNOTATION_NODE_TYPE)
    const typeParametersNode = findChildByType(node, TYPE_PARAMETERS_NODE_TYPE)

    const modifiers = extractModifiers(node)
    const decorators = extractDecorators(node)
    const accessor = extractAccessorType(node)

    const parameters = parametersNode ? extractParameters(parametersNode) : []
    const returnType = returnTypeNode
      ? extractTypeAnnotation(returnTypeNode)
      : undefined
    const typeParameters = typeParametersNode
      ? extractTypeParameters(typeParametersNode)
      : undefined

    const methodInfo: MethodInfo = {
      name: nameNode.text,
      parameters,
      returnType,
      typeParameters,
      decorators: decorators.length > 0 ? decorators : undefined,
      isStatic: modifiers.isStatic,
      isAsync: modifiers.isAsync,
      isAbstract: modifiers.isAbstract,
      accessor
    }

    return methodInfo
  } catch (error) {
    logger.error(
      `Failed to parse method info`,
      error instanceof Error ? error : String(error)
    )
    return null
  }
}

function parsePropertyInfo(node: ASTNode): PropertyInfo | null {
  try {
    const nameNode = findChildByType(node, PROPERTY_IDENTIFIER_NODE_TYPE)
    if (!nameNode) {
      logger.warn('Property definition missing name identifier')
      return null
    }

    const typeAnnotationNode = findChildByType(node, TYPE_ANNOTATION_NODE_TYPE)
    const modifiers = extractModifiers(node)
    const decorators = extractDecorators(node)
    const isReadonly = hasChildByType(node, 'readonly')

    const type = typeAnnotationNode
      ? extractTypeAnnotation(typeAnnotationNode)
      : undefined

    const propInfo: PropertyInfo = {
      name: nameNode.text,
      type,
      isStatic: modifiers.isStatic,
      isAbstract: modifiers.isAbstract,
      isReadonly,
      visibility: modifiers.visibility,
      decorators: decorators.length > 0 ? decorators : undefined
    }

    return propInfo
  } catch (error) {
    logger.error(
      `Failed to parse property info`,
      error instanceof Error ? error : String(error)
    )
    return null
  }
}

function parseAccessorInfo(node: ASTNode): AccessorInfo | null {
  try {
    const nameNode = findChildByType(node, PROPERTY_IDENTIFIER_NODE_TYPE)
    if (!nameNode) {
      logger.warn('Accessor declaration missing name identifier')
      return null
    }

    const typeAnnotationNode = findChildByType(node, TYPE_ANNOTATION_NODE_TYPE)
    const decorators = extractDecorators(node)
    const isStatic = hasChildByType(node, 'static')

    const accessor = hasChildByType(node, 'get') ? 'get' : 'set'
    const type = typeAnnotationNode
      ? extractTypeAnnotation(typeAnnotationNode)
      : undefined

    const accessorInfo: AccessorInfo = {
      name: nameNode.text,
      type,
      isStatic,
      accessor,
      decorators: decorators.length > 0 ? decorators : undefined
    }

    return accessorInfo
  } catch (error) {
    logger.error(
      `Failed to parse accessor info`,
      error instanceof Error ? error : String(error)
    )
    return null
  }
}

function extractDecorators(node: ASTNode): string[] {
  const decorators: string[] = []

  for (const child of node.children) {
    if (child.type === DECORATOR_NODE_TYPE) {
      const identifier = findChildByType(child, IDENTIFIER_NODE_TYPE)
      if (identifier) {
        decorators.push(identifier.text)
      } else {
        const callExpression = findChildByType(child, CALL_EXPRESSION_NODE_TYPE)
        if (callExpression) {
          const funcIdentifier = findChildByType(
            callExpression,
            IDENTIFIER_NODE_TYPE
          )
          if (funcIdentifier) {
            decorators.push(funcIdentifier.text)
          }
        }
      }
    }
  }

  return decorators
}

function extractTypeParameters(node: ASTNode): string[] {
  const typeParameters: string[] = []

  for (const child of node.children) {
    if (child.type === TYPE_PARAMETER_NODE_TYPE) {
      const identifier =
        findChildByType(child, TYPE_IDENTIFIER_NODE_TYPE) ||
        findChildByType(child, IDENTIFIER_NODE_TYPE)
      if (identifier) {
        typeParameters.push(identifier.text)
      }
    }
  }

  return typeParameters
}

function extractParameters(parametersNode: ASTNode): string[] {
  const parameters: string[] = []

  for (const child of parametersNode.children) {
    if (
      child.type === REQUIRED_PARAMETER_NODE_TYPE ||
      child.type === OPTIONAL_PARAMETER_NODE_TYPE
    ) {
      const identifier = findChildByType(child, IDENTIFIER_NODE_TYPE)
      if (identifier) {
        parameters.push(identifier.text)
      }
    }
  }

  return parameters
}

function extractTypeAnnotation(node: ASTNode): string {
  if (node.type !== 'type_annotation') {
    return 'unknown'
  }

  const typeNode = node.children.find(c => c.type !== ':')
  return typeNode?.text?.trim() || 'unknown'
}

function extractModifiers(node: ASTNode): {
  isStatic: boolean
  isAsync: boolean
  isAbstract: boolean
  visibility?: VisibilityModifier
} {
  const visibilityNode = findChildrenByType(node, 'public')
    .concat(findChildrenByType(node, 'private'))
    .concat(findChildrenByType(node, 'protected'))[0]

  let visibility: VisibilityModifier | undefined
  if (visibilityNode && isValidVisibilityModifier(visibilityNode.type)) {
    visibility = visibilityNode.type
  }

  return {
    isStatic: hasChildByType(node, 'static'),
    isAsync: hasChildByType(node, 'async'),
    isAbstract: hasChildByType(node, 'abstract'),
    visibility
  }
}

function extractAccessorType(node: ASTNode): 'get' | 'set' | undefined {
  if (hasChildByType(node, 'get')) {
    return 'get'
  }
  if (hasChildByType(node, 'set')) {
    return 'set'
  }
  return undefined
}
