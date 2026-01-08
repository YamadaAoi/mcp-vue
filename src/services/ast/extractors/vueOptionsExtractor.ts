import type { ASTNode } from '../types'
import { getLogger } from '../../../utils/logger'

const logger = getLogger()

const OBJECT_NODE_TYPE = 'object' as const
const PROPERTY_IDENTIFIER_NODE_TYPE = 'property_identifier' as const
const STRING_NODE_TYPE = 'string' as const
const FUNCTION_EXPRESSION_NODE_TYPE = 'function_expression' as const
const ARROW_FUNCTION_NODE_TYPE = 'arrow_function' as const
const METHOD_DEFINITION_NODE_TYPE = 'method_definition' as const
const EXPORT_STATEMENT_NODE_TYPE = 'export_statement' as const

const LIFECYCLE_HOOKS = new Set([
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeUnmount',
  'unmounted',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured',
  'renderTracked',
  'renderTriggered'
])

export interface VueOptionsAPIInfo {
  dataProperties: string[]
  computedProperties: string[]
  watchProperties: string[]
  methods: string[]
  lifecycleHooks: string[]
}

export function extractVueOptionsAPI(astNode: ASTNode): VueOptionsAPIInfo {
  const result: VueOptionsAPIInfo = {
    dataProperties: [],
    computedProperties: [],
    watchProperties: [],
    methods: [],
    lifecycleHooks: []
  }

  const queue: ASTNode[] = [astNode]
  let foundExportStatement = false

  while (queue.length > 0) {
    const node = queue.shift()!

    try {
      if (node.type === EXPORT_STATEMENT_NODE_TYPE) {
        foundExportStatement = true
        logger.debug('Found export_statement node')
        const objectNode = node.children.find(
          child => child.type === OBJECT_NODE_TYPE
        )
        if (objectNode) {
          logger.debug('Found object node')
          logger.debug('Processing object node directly')
          processObjectExpression(objectNode, result)
          break
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

  logger.debug('Extracted Vue Options API info', result)
  logger.debug(`Found export_statement: ${foundExportStatement}`)
  return result
}

function processObjectExpression(
  node: ASTNode,
  result: VueOptionsAPIInfo
): void {
  const properties = node.children.filter(
    child => child.type === 'pair' || child.type === METHOD_DEFINITION_NODE_TYPE
  )

  for (const property of properties) {
    try {
      const keyNode = property.children.find(
        child =>
          child.type === PROPERTY_IDENTIFIER_NODE_TYPE ||
          child.type === STRING_NODE_TYPE
      )

      if (!keyNode) continue

      const key = keyNode.text.replace(/['"]/g, '')

      switch (key) {
        case 'data':
          extractDataProperties(property, result)
          break
        case 'computed':
          extractPropertiesFromObject(property, result.computedProperties)
          break
        case 'watch':
          extractPropertiesFromObject(property, result.watchProperties)
          break
        case 'methods':
          extractPropertiesFromObject(property, result.methods)
          break
        case 'props':
        case 'components':
        case 'directives':
        case 'filters':
        case 'mixins':
        case 'extends':
        case 'provide':
        case 'inject':
          break
        default:
          if (LIFECYCLE_HOOKS.has(key)) {
            result.lifecycleHooks.push(key)
          }
      }
    } catch (error) {
      logger.error(
        `Failed to process property: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}

function extractDataProperties(
  property: ASTNode,
  result: VueOptionsAPIInfo
): void {
  const valueNode = property.children.find(
    child =>
      child.type === FUNCTION_EXPRESSION_NODE_TYPE ||
      child.type === ARROW_FUNCTION_NODE_TYPE ||
      child.type === METHOD_DEFINITION_NODE_TYPE
  )

  if (!valueNode) return

  const bodyNode = valueNode.children.find(
    child => child.type === 'statement_block'
  )
  if (!bodyNode) return

  const returnStatement = bodyNode.children.find(
    child => child.type === 'return_statement'
  )
  if (!returnStatement) return

  const returnExpression = returnStatement.children.find(
    child => child.type === 'object_expression' || child.type === 'object'
  )
  if (!returnExpression) return

  extractPropertiesFromObject(returnExpression, result.dataProperties)
}

function extractPropertiesFromObject(
  node: ASTNode,
  targetArray: string[]
): void {
  const properties = node.children.filter(
    child => child.type === 'pair' || child.type === METHOD_DEFINITION_NODE_TYPE
  )

  for (const prop of properties) {
    const keyNode = prop.children.find(
      child =>
        child.type === PROPERTY_IDENTIFIER_NODE_TYPE ||
        child.type === STRING_NODE_TYPE
    )
    if (keyNode) {
      targetArray.push(keyNode.text.replace(/['"]/g, ''))
    }
  }
}
