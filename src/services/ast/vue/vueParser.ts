import { parse as parseSFC } from '@vue/compiler-sfc'
import { type Node, type Tree } from 'web-tree-sitter'
import type {
  ParseResult,
  ASTNode,
  VueTemplateInfo,
  DirectiveInfo,
  BindingInfo,
  EventInfo
} from '../types'
import { parseTypeScript } from '../typescript/tsParser'
import { getParserPool } from '../pool/parserPool'
import { getLogger } from '../../../utils/logger'

const logger = getLogger()

const HTML_TAGS = new Set([
  'html',
  'head',
  'body',
  'div',
  'span',
  'p',
  'a',
  'img',
  'ul',
  'ol',
  'li',
  'table',
  'tr',
  'td',
  'th',
  'form',
  'input',
  'button',
  'select',
  'option',
  'textarea',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'section',
  'article',
  'header',
  'footer',
  'nav',
  'aside',
  'main',
  'template',
  'slot',
  'component',
  'transition',
  'transition-group'
])

function isValidNode(node: Node | null | undefined): node is Node {
  return node !== null && node !== undefined
}

function validateInput(code: string, filename: string): void {
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid code: code must be a non-empty string')
  }

  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename: filename must be a non-empty string')
  }
}

function convertTreeSitterNode(node: Node): ASTNode {
  const stack: { node: Node; parent: ASTNode | null }[] = [
    { node, parent: null }
  ]

  while (stack.length > 0) {
    const { node: currentNode, parent } = stack.pop()!

    const astNode: ASTNode = {
      type: currentNode.type,
      text: currentNode.text,
      startPosition: {
        row: currentNode.startPosition.row,
        column: currentNode.startPosition.column
      },
      endPosition: {
        row: currentNode.endPosition.row,
        column: currentNode.endPosition.column
      },
      children: []
    }

    if (parent) {
      parent.children.push(astNode)
    } else {
      return astNode
    }

    if (currentNode.children) {
      for (let i = currentNode.children.length - 1; i >= 0; i--) {
        const child = currentNode.children[i]
        if (isValidNode(child)) {
          stack.push({ node: child, parent: astNode })
        }
      }
    }
  }

  throw new Error('Failed to convert tree-sitter node')
}

function extractDirectives(astNode: ASTNode): DirectiveInfo[] {
  const directives: DirectiveInfo[] = []
  const stack: ASTNode[] = [astNode]

  while (stack.length > 0) {
    const node = stack.pop()
    if (!node) continue

    try {
      if (node.type === 'attribute') {
        const text = node.text

        if (text.startsWith('v-')) {
          const parts = text.split('.')
          const directiveName = parts[0]
          const modifiers = parts.slice(1)

          const match = directiveName.match(/v-(\w+)(?:=(.+))?/)
          if (match) {
            const name = match[1]
            const value = match[2]?.replace(/['"]/g, '')

            directives.push({
              name,
              value,
              modifiers,
              element: findElementName(node),
              startPosition: node.startPosition
            })
          }
        }
      }

      for (const child of node.children) {
        stack.push(child)
      }
    } catch (error) {
      logger.error(
        `Error processing directive node of type ${node.type}:`,
        error
      )
    }
  }

  return directives
}

function extractBindings(astNode: ASTNode): BindingInfo[] {
  const bindings: BindingInfo[] = []
  const stack: ASTNode[] = [astNode]

  while (stack.length > 0) {
    const node = stack.pop()
    if (!node) continue

    try {
      if (node.type === 'attribute') {
        const text = node.text

        if (text.startsWith(':') || text.startsWith('v-bind:')) {
          let name: string
          let expression: string

          if (text.startsWith(':')) {
            const match = text.match(/^:(\w+)=(.+)$/)
            if (match) {
              name = match[1]
              expression = match[2].replace(/['"]/g, '')
            } else {
              for (const child of node.children) {
                stack.push(child)
              }
              continue
            }
          } else {
            const match = text.match(/^v-bind:(\w+)=(.+)$/)
            if (match) {
              name = match[1]
              expression = match[2].replace(/['"]/g, '')
            } else {
              for (const child of node.children) {
                stack.push(child)
              }
              continue
            }
          }

          bindings.push({
            name,
            expression,
            element: findElementName(node),
            startPosition: node.startPosition
          })
        }
      }

      for (const child of node.children) {
        stack.push(child)
      }
    } catch (error) {
      logger.error(`Error processing binding node of type ${node.type}:`, error)
    }
  }

  return bindings
}

function extractEvents(astNode: ASTNode): EventInfo[] {
  const events: EventInfo[] = []
  const stack: ASTNode[] = [astNode]

  while (stack.length > 0) {
    const node = stack.pop()
    if (!node) continue

    try {
      if (node.type === 'attribute') {
        const text = node.text

        if (text.startsWith('@') || text.startsWith('v-on:')) {
          let name: string
          let handler: string
          const modifiers: string[] = []

          if (text.startsWith('@')) {
            const match = text.match(/^@(\w+)(?:\.(.+))?=(.+)$/)
            if (match) {
              name = match[1]
              if (match[2]) {
                modifiers.push(...match[2].split('.'))
              }
              handler = match[3].replace(/['"]/g, '')
            } else {
              for (const child of node.children) {
                stack.push(child)
              }
              continue
            }
          } else {
            const match = text.match(/^v-on:(\w+)(?:\.(.+))?=(.+)$/)
            if (match) {
              name = match[1]
              if (match[2]) {
                modifiers.push(...match[2].split('.'))
              }
              handler = match[3].replace(/['"]/g, '')
            } else {
              for (const child of node.children) {
                stack.push(child)
              }
              continue
            }
          }

          events.push({
            name,
            handler,
            modifiers,
            element: findElementName(node),
            startPosition: node.startPosition
          })
        }
      }

      for (const child of node.children) {
        stack.push(child)
      }
    } catch (error) {
      logger.error(`Error processing event node of type ${node.type}:`, error)
    }
  }

  return events
}

function extractComponents(astNode: ASTNode): string[] {
  const components: Set<string> = new Set()
  const stack: ASTNode[] = [astNode]

  while (stack.length > 0) {
    const node = stack.pop()
    if (!node) continue

    try {
      if (node.type === 'start_tag' || node.type === 'self_closing_tag') {
        const tagName = node.children.find(
          child => child.type === 'tag_name'
        )?.text

        if (tagName && !isHTMLTag(tagName)) {
          components.add(tagName)
        }
      }

      for (const child of node.children) {
        stack.push(child)
      }
    } catch (error) {
      logger.error(
        `Error processing component node of type ${node.type}:`,
        error
      )
    }
  }

  return Array.from(components)
}

function isHTMLTag(tagName: string): boolean {
  return HTML_TAGS.has(tagName.toLowerCase())
}

function findElementName(node: ASTNode): string {
  let current = node
  while (current) {
    if (current.type === 'start_tag' || current.type === 'self_closing_tag') {
      const tagName = current.children.find(
        child => child.type === 'tag_name'
      )?.text
      return tagName || 'unknown'
    }
    current = current.children[0]
  }
  return 'unknown'
}

export async function parseVue(
  code: string,
  filename: string
): Promise<ParseResult> {
  validateInput(code, filename)

  logger.debug(`Parsing Vue file: ${filename}`)

  const { descriptor, errors } = parseSFC(code, { filename })

  if (errors.length > 0) {
    logger.warn('Vue SFC parsing errors:', errors)
  }

  let scriptResult: ParseResult | null = null

  if (descriptor.script || descriptor.scriptSetup) {
    const scriptContent =
      descriptor.script?.content || descriptor.scriptSetup?.content || ''

    try {
      logger.debug(`Parsing script section of ${filename}`)
      scriptResult = await parseTypeScript(scriptContent, filename)
      logger.debug(`Successfully parsed script section of ${filename}`)
    } catch (error) {
      logger.error(`Failed to parse script in ${filename}:`, error)
    }
  }

  let vueTemplateInfo: VueTemplateInfo | undefined

  if (descriptor.template) {
    const templateContent = descriptor.template.content

    let templateAST: ASTNode | null = null

    const pool = getParserPool()
    const parserInstance = await pool.acquire('vue')
    let tree: Tree | null = null

    try {
      logger.debug(`Parsing template section of ${filename}`)
      tree = parserInstance.parser.parse(templateContent)
      if (tree) {
        templateAST = convertTreeSitterNode(tree.rootNode)
        logger.debug(`Successfully parsed template section of ${filename}`)
      }
    } catch (error) {
      logger.error(`Failed to parse template in ${filename}:`, error)
    } finally {
      if (tree) {
        try {
          tree.delete()
        } catch (error) {
          logger.warn('Failed to delete tree:', error)
        }
      }
      pool.release('vue', parserInstance)
    }

    if (templateAST) {
      vueTemplateInfo = {
        directives: extractDirectives(templateAST),
        bindings: extractBindings(templateAST),
        events: extractEvents(templateAST),
        components: extractComponents(templateAST)
      }

      logger.debug(`Extracted Vue template info from ${filename}`, {
        directives: vueTemplateInfo.directives.length,
        bindings: vueTemplateInfo.bindings.length,
        events: vueTemplateInfo.events.length,
        components: vueTemplateInfo.components.length
      })
    }
  }

  const result = {
    language: 'vue',
    ast: scriptResult?.ast || {
      type: 'root',
      text: '',
      startPosition: { row: 0, column: 0 },
      endPosition: { row: 0, column: 0 },
      children: []
    },
    functions: scriptResult?.functions || [],
    classes: scriptResult?.classes || [],
    variables: scriptResult?.variables || [],
    imports: scriptResult?.imports || [],
    exports: scriptResult?.exports || [],
    types: scriptResult?.types || [],
    vueTemplate: vueTemplateInfo
  }

  logger.debug(`Successfully parsed Vue file: ${filename}`, {
    hasScript: !!scriptResult,
    hasTemplate: !!vueTemplateInfo
  })

  return result
}
