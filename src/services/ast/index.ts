import type { ParseResult } from './types'
import type { ToolRegistration } from '../../utils/mcpServer'
import { parseTypeScript, parseTSX } from './typescript/tsParser'
import { parseVue } from './vue/vueParser'
import { getLogger } from '../../utils/logger.js'

const logger = getLogger()

export async function parseFile(
  code: string,
  filename: string
): Promise<ParseResult> {
  logger.debug(`Parsing file: ${filename}`, { codeLength: code.length })

  const ext = filename.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'ts':
      logger.debug(`Parsing TypeScript file: ${filename}`)
      return parseTypeScript(code, filename)
    case 'tsx':
      logger.debug(`Parsing TSX file: ${filename}`)
      return parseTSX(code, filename)
    case 'vue':
      logger.debug(`Parsing Vue file: ${filename}`)
      return parseVue(code, filename)
    default:
      logger.error(`Unsupported file type: ${ext}`, { filename })
      throw new Error(`Unsupported file type: ${ext}`)
  }
}

export async function parseCode(
  code: string,
  language: string
): Promise<ParseResult> {
  switch (language) {
    case 'typescript':
    case 'ts':
      return parseTypeScript(code, 'unknown.ts')
    case 'tsx':
      return parseTSX(code, 'unknown.tsx')
    case 'vue':
      return parseVue(code, 'unknown.vue')
    default:
      throw new Error(`Unsupported language: ${language}`)
  }
}

export function createASTTools(): ToolRegistration[] {
  return [
    {
      tool: {
        name: 'parse_code',
        description:
          'Parse TypeScript, JavaScript, or Vue code and extract AST information including functions, classes, variables, imports, exports, and types',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The source code to parse'
            },
            filename: {
              type: 'string',
              description:
                'The filename (used to determine language and for Vue SFC parsing)'
            }
          },
          required: ['code', 'filename']
        }
      },
      handler: async args => {
        const { code, filename } = args as { code: string; filename: string }

        logger.debug(`parse_code tool called for: ${filename}`, {
          codeLength: code.length
        })

        if (!code || typeof code !== 'string') {
          logger.error('Invalid or missing code parameter')
          throw new Error('Invalid or missing code parameter')
        }

        if (!filename || typeof filename !== 'string') {
          logger.error('Invalid or missing filename parameter')
          throw new Error('Invalid or missing filename parameter')
        }

        try {
          const result = await parseFile(code, filename)

          logger.info(`Successfully parsed: ${filename}`, {
            functions: result.functions.length,
            classes: result.classes.length,
            types: result.types.length,
            imports: result.imports.length,
            exports: result.exports.length,
            variables: result.variables.length
          })

          return {
            success: true,
            language: result.language,
            functions: result.functions.map(fn => ({
              name: fn.name,
              type: fn.type,
              parameters: fn.parameters,
              returnType: fn.returnType,
              position: {
                start: fn.startPosition,
                end: fn.endPosition
              }
            })),
            classes: result.classes.map(cls => ({
              name: cls.name,
              extends: cls.extends,
              implements: cls.implements,
              methods: cls.methods,
              properties: cls.properties,
              position: {
                start: cls.startPosition,
                end: cls.endPosition
              }
            })),
            variables: result.variables.map(v => ({
              name: v.name,
              type: v.type,
              value: v.value,
              isConst: v.isConst,
              position: v.startPosition
            })),
            imports: result.imports.map(imp => ({
              source: imp.source,
              imports: imp.imports,
              isDefault: imp.isDefault,
              isNamespace: imp.isNamespace,
              position: imp.startPosition
            })),
            exports: result.exports.map(exp => ({
              name: exp.name,
              type: exp.type,
              isDefault: exp.isDefault,
              position: exp.startPosition
            })),
            types: result.types.map(t => ({
              name: t.name,
              kind: t.kind,
              properties: t.properties,
              methods: t.methods,
              position: {
                start: t.startPosition,
                end: t.endPosition
              }
            })),
            vueTemplate: result.vueTemplate
          }
        } catch (error) {
          throw new Error(
            `Failed to parse code: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
    },
    {
      tool: {
        name: 'find_functions',
        description:
          'Find all functions in the parsed code with their signatures and locations',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The source code to parse'
            },
            filename: {
              type: 'string',
              description: 'The filename (used to determine language)'
            }
          },
          required: ['code', 'filename']
        }
      },
      handler: async args => {
        const { code, filename } = args as { code: string; filename: string }

        logger.debug(`find_functions tool called for: ${filename}`)

        if (!code || typeof code !== 'string') {
          logger.error('Invalid or missing code parameter')
          throw new Error('Invalid or missing code parameter')
        }

        if (!filename || typeof filename !== 'string') {
          logger.error('Invalid or missing filename parameter')
          throw new Error('Invalid or missing filename parameter')
        }

        try {
          const result = await parseFile(code, filename)

          logger.info(
            `Found ${result.functions.length} functions in: ${filename}`
          )

          return {
            success: true,
            count: result.functions.length,
            functions: result.functions.map(fn => ({
              name: fn.name,
              type: fn.type,
              parameters: fn.parameters,
              returnType: fn.returnType,
              position: {
                start: fn.startPosition,
                end: fn.endPosition
              }
            }))
          }
        } catch (error) {
          logger.error(`Failed to find functions in: ${filename}`, error)
          throw new Error(
            `Failed to find functions: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
    },
    {
      tool: {
        name: 'find_classes',
        description:
          'Find all classes in the parsed code with their methods, properties, and inheritance information',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The source code to parse'
            },
            filename: {
              type: 'string',
              description: 'The filename (used to determine language)'
            }
          },
          required: ['code', 'filename']
        }
      },
      handler: async args => {
        const { code, filename } = args as { code: string; filename: string }

        logger.debug(`find_classes tool called for: ${filename}`)

        if (!code || typeof code !== 'string') {
          logger.error('Invalid or missing code parameter')
          throw new Error('Invalid or missing code parameter')
        }

        if (!filename || typeof filename !== 'string') {
          logger.error('Invalid or missing filename parameter')
          throw new Error('Invalid or missing filename parameter')
        }

        try {
          const result = await parseFile(code, filename)

          logger.info(`Found ${result.classes.length} classes in: ${filename}`)

          return {
            success: true,
            count: result.classes.length,
            classes: result.classes.map(cls => ({
              name: cls.name,
              extends: cls.extends,
              implements: cls.implements,
              methods: cls.methods,
              properties: cls.properties,
              position: {
                start: cls.startPosition,
                end: cls.endPosition
              }
            }))
          }
        } catch (error) {
          logger.error(`Failed to find classes in: ${filename}`, error)
          throw new Error(
            `Failed to find classes: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
    },
    {
      tool: {
        name: 'find_imports',
        description:
          'Find all import statements in the parsed code with their sources and imported items',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The source code to parse'
            },
            filename: {
              type: 'string',
              description: 'The filename (used to determine language)'
            }
          },
          required: ['code', 'filename']
        }
      },
      handler: async args => {
        const { code, filename } = args as { code: string; filename: string }

        logger.debug(`find_imports tool called for: ${filename}`)

        if (!code || typeof code !== 'string') {
          logger.error('Invalid or missing code parameter')
          throw new Error('Invalid or missing code parameter')
        }

        if (!filename || typeof filename !== 'string') {
          logger.error('Invalid or missing filename parameter')
          throw new Error('Invalid or missing filename parameter')
        }

        try {
          const result = await parseFile(code, filename)

          logger.info(`Found ${result.imports.length} imports in: ${filename}`)

          return {
            success: true,
            count: result.imports.length,
            imports: result.imports.map(imp => ({
              source: imp.source,
              imports: imp.imports,
              isDefault: imp.isDefault,
              isNamespace: imp.isNamespace,
              position: imp.startPosition
            }))
          }
        } catch (error) {
          logger.error(`Failed to find imports in: ${filename}`, error)
          throw new Error(
            `Failed to find imports: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
    },
    {
      tool: {
        name: 'find_exports',
        description:
          'Find all export statements in the parsed code with their names and types',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The source code to parse'
            },
            filename: {
              type: 'string',
              description: 'The filename (used to determine language)'
            }
          },
          required: ['code', 'filename']
        }
      },
      handler: async args => {
        const { code, filename } = args as { code: string; filename: string }

        logger.debug(`find_exports tool called for: ${filename}`)

        if (!code || typeof code !== 'string') {
          logger.error('Invalid or missing code parameter')
          throw new Error('Invalid or missing code parameter')
        }

        if (!filename || typeof filename !== 'string') {
          logger.error('Invalid or missing filename parameter')
          throw new Error('Invalid or missing filename parameter')
        }

        try {
          const result = await parseFile(code, filename)

          logger.info(`Found ${result.exports.length} exports in: ${filename}`)

          return {
            success: true,
            count: result.exports.length,
            exports: result.exports.map(exp => ({
              name: exp.name,
              type: exp.type,
              isDefault: exp.isDefault,
              position: exp.startPosition
            }))
          }
        } catch (error) {
          logger.error(`Failed to find exports in: ${filename}`, error)
          throw new Error(
            `Failed to find exports: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
    },
    {
      tool: {
        name: 'find_types',
        description:
          'Find all type definitions (interfaces, type aliases, enums) in the parsed code',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The source code to parse'
            },
            filename: {
              type: 'string',
              description: 'The filename (used to determine language)'
            }
          },
          required: ['code', 'filename']
        }
      },
      handler: async args => {
        const { code, filename } = args as { code: string; filename: string }

        logger.debug(`find_types tool called for: ${filename}`)

        if (!code || typeof code !== 'string') {
          logger.error('Invalid or missing code parameter')
          throw new Error('Invalid or missing code parameter')
        }

        if (!filename || typeof filename !== 'string') {
          logger.error('Invalid or missing filename parameter')
          throw new Error('Invalid or missing filename parameter')
        }

        try {
          const result = await parseFile(code, filename)

          logger.info(`Found ${result.types.length} types in: ${filename}`)

          return {
            success: true,
            count: result.types.length,
            types: result.types.map(t => ({
              name: t.name,
              kind: t.kind,
              properties: t.properties,
              methods: t.methods,
              position: {
                start: t.startPosition,
                end: t.endPosition
              }
            }))
          }
        } catch (error) {
          logger.error(`Failed to find types in: ${filename}`, error)
          throw new Error(
            `Failed to find types: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
    },
    {
      tool: {
        name: 'find_variables',
        description:
          'Find all variable declarations in the parsed code with their types and values',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The source code to parse'
            },
            filename: {
              type: 'string',
              description: 'The filename (used to determine language)'
            }
          },
          required: ['code', 'filename']
        }
      },
      handler: async args => {
        const { code, filename } = args as { code: string; filename: string }

        logger.debug(`find_variables tool called for: ${filename}`)

        if (!code || typeof code !== 'string') {
          logger.error('Invalid or missing code parameter')
          throw new Error('Invalid or missing code parameter')
        }

        if (!filename || typeof filename !== 'string') {
          logger.error('Invalid or missing filename parameter')
          throw new Error('Invalid or missing filename parameter')
        }

        try {
          const result = await parseFile(code, filename)

          logger.info(
            `Found ${result.variables.length} variables in: ${filename}`
          )

          return {
            success: true,
            count: result.variables.length,
            variables: result.variables.map(v => ({
              name: v.name,
              type: v.type,
              value: v.value,
              isConst: v.isConst,
              position: v.startPosition
            }))
          }
        } catch (error) {
          logger.error(`Failed to find variables in: ${filename}`, error)
          throw new Error(
            `Failed to find variables: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
    },
    {
      tool: {
        name: 'analyze_vue_template',
        description:
          'Analyze Vue template directives, bindings, events, and components',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The Vue SFC source code to parse'
            },
            filename: {
              type: 'string',
              description: 'The filename (must end with .vue)'
            }
          },
          required: ['code', 'filename']
        }
      },
      handler: async args => {
        const { code, filename } = args as { code: string; filename: string }

        if (!code || typeof code !== 'string') {
          throw new Error('Invalid or missing code parameter')
        }

        if (!filename || typeof filename !== 'string') {
          throw new Error('Invalid or missing filename parameter')
        }

        if (!filename.endsWith('.vue')) {
          throw new Error(
            'Filename must end with .vue for Vue template analysis'
          )
        }

        try {
          const result = await parseFile(code, filename)

          if (!result.vueTemplate) {
            return {
              success: true,
              message: 'No template found in this Vue SFC',
              template: null
            }
          }

          return {
            success: true,
            template: {
              directives: result.vueTemplate.directives,
              bindings: result.vueTemplate.bindings,
              events: result.vueTemplate.events,
              components: result.vueTemplate.components
            }
          }
        } catch (error) {
          throw new Error(
            `Failed to analyze Vue template: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        }
      }
    }
  ]
}
