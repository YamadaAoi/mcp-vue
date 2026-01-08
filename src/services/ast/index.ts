import type { ParseResult, MappedParseResult } from './types'
import type { ToolRegistration } from '../../utils/mcpServer'
import { parseTypeScript, parseTSX } from './typescript/tsParser'
import { parseVue } from './vue/vueParser'
import { getLogger } from '../../utils/logger'
import { getConfigManager } from '../../utils/config'
import { readFileSync, statSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { CacheManager } from './cache/cacheManager'
import { buildSummary } from './summaryBuilder'

const logger = getLogger()
export const cacheManager = new CacheManager(100, 5 * 60 * 1000)

const SUPPORTED_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'vue'] as const

type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number]

const PARSER_MAP: Record<
  SupportedExtension,
  (code: string, filename: string) => Promise<ParseResult>
> = {
  ts: parseTypeScript,
  tsx: parseTSX,
  js: parseTypeScript,
  jsx: parseTSX,
  vue: parseVue
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

function isValidFilepath(filepath: unknown): filepath is string {
  return typeof filepath === 'string' && filepath.length > 0
}

function validateParseArgs(filepath: unknown): asserts filepath is string {
  if (!isValidFilepath(filepath)) {
    logger.error('Invalid or missing filepath parameter')
    throw new Error('Invalid or missing filepath parameter')
  }
}

function validateFileSize(filepath: string, content: string): void {
  const size = Buffer.byteLength(content, 'utf8')
  if (size > MAX_FILE_SIZE) {
    const sizeMB = (size / (1024 * 1024)).toFixed(2)
    const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(2)
    logger.error(`File too large: ${filepath} (${sizeMB}MB > ${maxSizeMB}MB)`)
    throw new Error(
      `File too large: ${filepath} (${sizeMB}MB exceeds maximum of ${maxSizeMB}MB)`
    )
  }
}

function resolveFilepath(filepath: string): string {
  const config = getConfigManager()
  const cwd = config.cwd

  const possiblePaths = [filepath, resolve(cwd, filepath), resolve(filepath)]

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      const resolved = resolve(path)
      logger.debug(`Resolved filepath: ${filepath} -> ${resolved}`)
      return resolved
    }
  }

  logger.error(`File not found: ${filepath}`, { cwd })
  throw new Error(`File not found: ${filepath}`)
}

function handleParseError(
  error: unknown,
  operation: string,
  filename?: string
): never {
  const message = error instanceof Error ? error.message : 'Unknown error'
  const errorMessage = `Failed to ${operation}${filename ? ` in ${filename}` : ''}: ${message}`

  logger.error(errorMessage, error)

  throw new Error(errorMessage)
}

export function mapParseResult(result: ParseResult): MappedParseResult {
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
    functionCalls: result.functionCalls.map(call => ({
      name: call.name,
      arguments: call.arguments,
      position: {
        start: call.startPosition,
        end: call.endPosition
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
    vueTemplate: result.vueTemplate,
    vueOptionsAPI: result.vueOptionsAPI
  }
}

export async function parseFile(filepath: string): Promise<ParseResult> {
  logger.debug(`Parsing file: ${filepath}`)

  const resolvedPath = resolveFilepath(filepath)
  const filename = filepath.split(/[/\\]/).pop() || filepath

  const ext = filename.split('.').pop()?.toLowerCase() as SupportedExtension

  if (!ext || !SUPPORTED_EXTENSIONS.includes(ext)) {
    logger.error(`Unsupported file type: ${ext}`, { filepath })
    throw new Error(`Unsupported file type: ${ext}`)
  }

  const stats = statSync(resolvedPath)
  const cacheKey = `${resolvedPath}:${stats.mtimeMs}`

  const cached = cacheManager.getFromCache(cacheKey)
  if (cached) {
    logger.info(`Cache hit for: ${filepath}`, {
      functions: cached.functions.length,
      classes: cached.classes.length,
      types: cached.types.length,
      imports: cached.imports.length,
      exports: cached.exports.length,
      variables: cached.variables.length,
      hasVueTemplate: !!cached.vueTemplate
    })
    return cached
  }

  const code = readFileSync(resolvedPath, 'utf-8')
  validateFileSize(filepath, code)

  logger.debug(`Read file: ${filepath}`, { size: code.length })

  return cacheManager.getOrCompute(cacheKey, async () => {
    const parser = PARSER_MAP[ext]

    logger.debug(`Parsing ${ext.toUpperCase()} file: ${filepath}`)

    const result = await parser(code, filename)

    logger.info(`Parsed and cached: ${filepath}`, {
      functions: result.functions.length,
      classes: result.classes.length,
      types: result.types.length,
      imports: result.imports.length,
      exports: result.exports.length,
      variables: result.variables.length,
      hasVueTemplate: !!result.vueTemplate
    })

    return result
  })
}

export function createASTTools(): ToolRegistration[] {
  return [
    {
      tool: {
        name: 'parse_code',
        description:
          'Parse a TypeScript, JavaScript, or Vue file and extract ALL AST information in one call. This is the PRIMARY and RECOMMENDED tool for code analysis. It returns: functions, classes, variables, imports, exports, types, and for Vue files - template directives, bindings, events, and components. The MCP server will read the file from the local filesystem, so you only need to provide the file path.',
        inputSchema: {
          type: 'object',
          properties: {
            filepath: {
              type: 'string',
              description: 'The absolute or relative path to the file to parse'
            }
          },
          required: ['filepath']
        }
      },
      handler: async args => {
        const { filepath } = args as { filepath: string }

        logger.debug(`parse_code tool called for: ${filepath}`)

        validateParseArgs(filepath)

        try {
          const result = await parseFile(filepath)

          logger.info(`Successfully parsed: ${filepath}`, {
            functions: result.functions.length,
            classes: result.classes.length,
            types: result.types.length,
            imports: result.imports.length,
            exports: result.exports.length,
            variables: result.variables.length,
            hasVueTemplate: !!result.vueTemplate,
            cacheSize: cacheManager.size
          })

          const parsedResult = mapParseResult(result)

          const summary = buildSummary(parsedResult, filepath)

          return {
            content: [
              {
                type: 'text',
                text: summary
              }
            ]
          }
        } catch (error) {
          handleParseError(error, 'parse code', filepath)
        }
      }
    }
  ]
}
