import { Parser, Language } from 'web-tree-sitter'
import { Mutex } from '../../../utils/mutex'
import typescriptWasmUrl from 'tree-sitter-typescript/tree-sitter-typescript.wasm?url'
import tsxWasmUrl from 'tree-sitter-typescript/tree-sitter-tsx.wasm?url'

interface ParserInstance {
  parser: Parser
  language: Language
  inUse: boolean
}

export class ParserPool {
  #pool: Map<string, ParserInstance[]> = new Map()
  #maxPoolSize: number
  #initMutex: Mutex = new Mutex()
  #poolMutex: Mutex = new Mutex()
  #languageCache: Map<string, Language> = new Map()

  constructor(maxPoolSize = 4) {
    this.#maxPoolSize = maxPoolSize
  }

  async #loadLanguage(languageType: string): Promise<Language> {
    if (this.#languageCache.has(languageType)) {
      return this.#languageCache.get(languageType)!
    }

    return this.#initMutex.runExclusive(async () => {
      if (this.#languageCache.has(languageType)) {
        return this.#languageCache.get(languageType)!
      }

      await Parser.init()

      const wasmUrl = languageType === 'tsx' ? tsxWasmUrl : typescriptWasmUrl
      const wasmResponse = await fetch(wasmUrl)
      const wasmBuffer = await wasmResponse.arrayBuffer()
      const language = await Language.load(new Uint8Array(wasmBuffer))

      this.#languageCache.set(languageType, language)

      return language
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

  async acquire(
    languageType: 'typescript' | 'tsx' | 'vue'
  ): Promise<ParserInstance> {
    const poolKey = languageType

    return this.#poolMutex.runExclusive(async () => {
      let pool = this.#pool.get(poolKey)

      if (!pool) {
        pool = []
        this.#pool.set(poolKey, pool)
      }

      const available = pool.find(p => !p.inUse)

      if (available) {
        available.inUse = true
        return available
      }

      if (pool.length < this.#maxPoolSize) {
        const parser = await this.#createParser(languageType)
        parser.inUse = true
        pool.push(parser)
        return parser
      }

      const parser = await this.#createParser(languageType)
      parser.inUse = true
      pool.push(parser)

      return parser
    })
  }

  release(languageType: string, parserInstance: ParserInstance): void {
    void this.#poolMutex.runExclusive(() => {
      const pool = this.#pool.get(languageType)
      if (pool) {
        const instance = pool.find(p => p.parser === parserInstance.parser)
        if (instance) {
          instance.inUse = false
        }
      }
    })
  }

  getPoolSize(languageType: string): number {
    const pool = this.#pool.get(languageType)
    return pool ? pool.length : 0
  }

  getActiveCount(languageType: string): number {
    const pool = this.#pool.get(languageType)
    if (!pool) return 0
    return pool.filter(p => p.inUse).length
  }

  clear(): void {
    this.#pool.forEach(pool => {
      pool.forEach(instance => {
        instance.parser.delete()
      })
    })
    this.#pool.clear()
    this.#languageCache.clear()
  }
}

let globalParserPool: ParserPool | null = null

export function getParserPool(): ParserPool {
  if (!globalParserPool) {
    globalParserPool = new ParserPool(4)
  }
  return globalParserPool
}
