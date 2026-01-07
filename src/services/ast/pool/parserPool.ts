import { Parser, Language } from 'web-tree-sitter'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { Mutex } from '../../../utils/mutex'
import { getLogger } from '../../../utils/logger'

const logger = getLogger()
const require = createRequire(import.meta.url)

const DEFAULT_MAX_POOL_SIZE = 4
const WASM_TYPESCRIPT = 'tree-sitter-typescript.wasm'
const WASM_TSX = 'tree-sitter-tsx.wasm'

const SUPPORTED_LANGUAGE_TYPES = [
  'typescript',
  'tsx',
  'vue',
  'javascript',
  'jsx'
] as const

type SupportedLanguageType = (typeof SUPPORTED_LANGUAGE_TYPES)[number]

function isValidLanguageType(
  languageType: string
): languageType is SupportedLanguageType {
  return SUPPORTED_LANGUAGE_TYPES.includes(
    languageType as SupportedLanguageType
  )
}

function isValidPoolSize(size: unknown): size is number {
  return typeof size === 'number' && size > 0
}

interface ParserInstance {
  parser: Parser
  language: Language
  inUse: boolean
}

export class ParserPool {
  #pool: Map<string, ParserInstance[]> = new Map()
  #maxPoolSize: number
  #initMutex = new Mutex()
  #poolMutex = new Mutex()
  #languageCache: Map<string, Language> = new Map()

  constructor(maxPoolSize = DEFAULT_MAX_POOL_SIZE) {
    this.#maxPoolSize = isValidPoolSize(maxPoolSize)
      ? maxPoolSize
      : DEFAULT_MAX_POOL_SIZE
    logger.debug(`ParserPool initialized with max size: ${this.#maxPoolSize}`)
  }

  async #loadLanguage(languageType: string): Promise<Language> {
    if (!isValidLanguageType(languageType)) {
      logger.error(`Unsupported language type: ${languageType}`)
      throw new Error(`Unsupported language type: ${languageType}`)
    }

    if (this.#languageCache.has(languageType)) {
      logger.debug(`Using cached language: ${languageType}`)
      return this.#languageCache.get(languageType)!
    }

    return this.#initMutex.runExclusive(async () => {
      if (this.#languageCache.has(languageType)) {
        logger.debug(`Using cached language: ${languageType}`)
        return this.#languageCache.get(languageType)!
      }

      await Parser.init()

      try {
        const wasmFileName =
          languageType === 'tsx' || languageType === 'jsx'
            ? WASM_TSX
            : WASM_TYPESCRIPT

        const packageJsonPath =
          require.resolve('tree-sitter-typescript/package.json')
        const packageDir = dirname(packageJsonPath)
        const wasmPath = resolve(packageDir, wasmFileName)

        logger.debug(`Loading WASM file for ${languageType} from: ${wasmPath}`)

        const wasmBuffer = readFileSync(wasmPath)
        const language = await Language.load(new Uint8Array(wasmBuffer))

        this.#languageCache.set(languageType, language)

        logger.info(`Successfully loaded language: ${languageType}`)

        return language
      } catch (error) {
        logger.error(
          `Failed to load WASM file for ${languageType}`,
          error instanceof Error ? error : String(error)
        )
        throw new Error(
          `Failed to load language ${languageType}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    })
  }

  async #createParser(languageType: string): Promise<ParserInstance> {
    const language = await this.#loadLanguage(languageType)

    const parser = new Parser()
    parser.setLanguage(language)

    return {
      parser,
      language,
      inUse: false
    }
  }

  async acquire(languageType: SupportedLanguageType): Promise<ParserInstance> {
    if (!isValidLanguageType(languageType)) {
      logger.error(`Unsupported language type: ${languageType as string}`)
      throw new Error(`Unsupported language type: ${languageType as string}`)
    }

    const poolKey = languageType

    return this.#poolMutex.runExclusive(async () => {
      let pool = this.#pool.get(poolKey)

      if (!pool) {
        pool = []
        this.#pool.set(poolKey, pool)
      }

      const available = pool.find(p => !p.inUse)

      if (available) {
        logger.debug(`Acquired existing parser for: ${languageType}`)
        available.inUse = true
        return available
      }

      if (pool.length < this.#maxPoolSize) {
        logger.debug(`Creating new parser for: ${languageType}`)
        const parser = await this.#createParser(languageType)
        parser.inUse = true
        pool.push(parser)
        return parser
      }

      logger.debug(`Pool full for ${languageType}, creating temporary parser`)
      const parser = await this.#createParser(languageType)
      parser.inUse = true
      pool.push(parser)

      return parser
    })
  }

  release(languageType: string, parserInstance: ParserInstance): void {
    this.#poolMutex
      .runExclusive(() => {
        const pool = this.#pool.get(languageType)
        if (pool) {
          const instance = pool.find(p => p.parser === parserInstance.parser)
          if (instance) {
            instance.inUse = false
            logger.debug(`Released parser for language: ${languageType}`)
          }
        }
      })
      .catch(error => {
        logger.error(
          `Failed to release parser for language '${languageType}'`,
          { error: error instanceof Error ? error.message : String(error) }
        )
      })
  }

  clear(): void {
    this.#pool.forEach(pool => {
      pool.forEach(instance => {
        instance.parser.delete()
      })
    })
    this.#pool.clear()
    this.#languageCache.clear()
    logger.info('Parser pool cleared')
  }
}

let globalParserPool: ParserPool | null = null

export function getParserPool(): ParserPool {
  if (!globalParserPool) {
    globalParserPool = new ParserPool(DEFAULT_MAX_POOL_SIZE)
  }
  return globalParserPool
}
