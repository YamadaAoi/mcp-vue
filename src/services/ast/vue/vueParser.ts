import { parse as parseSFC } from '@vue/compiler-sfc'
import { type Node } from 'web-tree-sitter'
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

function convertTreeSitterNode(node: Node): ASTNode {
  const children: ASTNode[] = []

  if (node.children) {
    for (const child of node.children) {
      if (child) {
        children.push(convertTreeSitterNode(child))
      }
    }
  }

  return {
    type: node.type,
    text: node.text,
    startPosition: {
      row: node.startPosition.row,
      column: node.startPosition.column
    },
    endPosition: {
      row: node.endPosition.row,
      column: node.endPosition.column
    },
    children
  }
}

function extractDirectives(astNode: ASTNode): DirectiveInfo[] {
  const directives: DirectiveInfo[] = []

  const extractFromNode = (node: ASTNode) => {
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
      extractFromNode(child)
    }
  }

  extractFromNode(astNode)
  return directives
}

function extractBindings(astNode: ASTNode): BindingInfo[] {
  const bindings: BindingInfo[] = []

  const extractFromNode = (node: ASTNode) => {
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
            return
          }
        } else {
          const match = text.match(/^v-bind:(\w+)=(.+)$/)
          if (match) {
            name = match[1]
            expression = match[2].replace(/['"]/g, '')
          } else {
            return
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
      extractFromNode(child)
    }
  }

  extractFromNode(astNode)
  return bindings
}

function extractEvents(astNode: ASTNode): EventInfo[] {
  const events: EventInfo[] = []

  const extractFromNode = (node: ASTNode) => {
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
            return
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
            return
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
      extractFromNode(child)
    }
  }

  extractFromNode(astNode)
  return events
}

function extractComponents(astNode: ASTNode): string[] {
  const components: Set<string> = new Set()

  const extractFromNode = (node: ASTNode) => {
    if (node.type === 'start_tag' || node.type === 'self_closing_tag') {
      const tagName = node.children.find(
        child => child.type === 'tag_name'
      )?.text

      if (tagName && !isHTMLTag(tagName)) {
        components.add(tagName)
      }
    }

    for (const child of node.children) {
      extractFromNode(child)
    }
  }

  extractFromNode(astNode)
  return Array.from(components)
}

function isHTMLTag(tagName: string): boolean {
  const htmlTags = new Set([
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

  return htmlTags.has(tagName.toLowerCase())
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
  const { descriptor, errors } = parseSFC(code, { filename })

  if (errors.length > 0) {
    console.warn('Vue SFC parsing errors:', errors)
  }

  let scriptResult: ParseResult | null = null

  if (descriptor.script || descriptor.scriptSetup) {
    const scriptContent =
      descriptor.script?.content || descriptor.scriptSetup?.content || ''

    try {
      scriptResult = await parseTypeScript(scriptContent, filename)
    } catch (error) {
      console.warn('Failed to parse script:', error)
    }
  }

  let vueTemplateInfo: VueTemplateInfo | undefined

  if (descriptor.template) {
    const templateContent = descriptor.template.content

    let templateAST: ASTNode | null = null

    const pool = getParserPool()
    const parserInstance = await pool.acquire('vue')

    try {
      const tree = parserInstance.parser.parse(templateContent)
      if (tree) {
        templateAST = convertTreeSitterNode(tree.rootNode)
        tree.delete()
      }
    } catch (error) {
      console.warn('Failed to parse template:', error)
    } finally {
      pool.release('vue', parserInstance)
    }

    if (templateAST) {
      vueTemplateInfo = {
        directives: extractDirectives(templateAST),
        bindings: extractBindings(templateAST),
        events: extractEvents(templateAST),
        components: extractComponents(templateAST)
      }
    }
  }

  return {
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
}
