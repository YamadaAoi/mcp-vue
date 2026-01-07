import { createHash } from 'node:crypto'
import type { ParseResult } from '../types'
import { getLogger } from '../../../utils/logger'

const logger = getLogger()

const DEFAULT_MAX_CACHE_SIZE = 100
const DEFAULT_CACHE_TTL = 5 * 60 * 1000
const HASH_ALGORITHM = 'sha256'

interface CacheEntry {
  hash: string
  result: ParseResult
  timestamp: number
}

function isValidHash(hash: unknown): hash is string {
  return typeof hash === 'string' && hash.length > 0
}

function isValidCacheSize(size: unknown): size is number {
  return typeof size === 'number' && size > 0
}

function isValidCacheTTL(ttl: unknown): ttl is number {
  return typeof ttl === 'number' && ttl > 0
}

export class CacheManager {
  #cache: Map<string, CacheEntry> = new Map()
  #maxCacheSize: number
  #cacheTTL: number
  #pendingRequests: Map<string, Promise<unknown>> = new Map()

  constructor(
    maxCacheSize = DEFAULT_MAX_CACHE_SIZE,
    cacheTTL = DEFAULT_CACHE_TTL
  ) {
    this.#maxCacheSize = isValidCacheSize(maxCacheSize)
      ? maxCacheSize
      : DEFAULT_MAX_CACHE_SIZE
    this.#cacheTTL = isValidCacheTTL(cacheTTL) ? cacheTTL : DEFAULT_CACHE_TTL
    logger.debug(
      `CacheManager initialized with max size: ${this.#maxCacheSize}, TTL: ${this.#cacheTTL}ms`
    )
  }

  generateHash(code: string): string {
    return createHash(HASH_ALGORITHM).update(code).digest('hex')
  }

  getFromCache(hash: string): ParseResult | null {
    if (!isValidHash(hash)) {
      logger.warn('Invalid hash provided to getFromCache')
      return null
    }

    const entry = this.#cache.get(hash)
    if (!entry) {
      logger.debug(`Cache miss for hash: ${hash.substring(0, 8)}...`)
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > this.#cacheTTL) {
      logger.debug(`Cache entry expired for hash: ${hash.substring(0, 8)}...`)
      this.#cache.delete(hash)
      return null
    }

    const result = entry.result

    this.#cache.delete(hash)
    this.#cache.set(hash, entry)

    logger.debug(`Cache hit for hash: ${hash.substring(0, 8)}...`)
    return result
  }

  setCache(hash: string, result: ParseResult): void {
    if (!isValidHash(hash)) {
      logger.warn('Invalid hash provided to setCache')
      return
    }

    if (this.#cache.has(hash)) {
      this.#cache.delete(hash)
    }

    while (this.#cache.size >= this.#maxCacheSize) {
      const firstKey = this.#cache.keys().next().value
      if (firstKey) {
        this.#cache.delete(firstKey)
      } else {
        break
      }
    }

    this.#cache.set(hash, {
      hash,
      result,
      timestamp: Date.now()
    })

    logger.debug(`Cache entry set for hash: ${hash.substring(0, 8)}...`)
  }

  async getOrCompute<T>(
    hash: string,
    compute: () => T | Promise<T>
  ): Promise<T> {
    if (!isValidHash(hash)) {
      logger.warn('Invalid hash provided to getOrCompute')
      throw new Error('Invalid hash provided')
    }

    const cached = this.getFromCache(hash)
    if (cached) {
      return cached as T
    }

    const existingPromise = this.#pendingRequests.get(hash)
    if (existingPromise) {
      logger.debug(
        `Using existing promise for hash: ${hash.substring(0, 8)}...`
      )
      return existingPromise as Promise<T>
    }

    logger.debug(`Computing result for hash: ${hash.substring(0, 8)}...`)
    const promise = Promise.resolve(compute())
      .then(result => {
        this.setCache(hash, result as ParseResult)
        this.#pendingRequests.delete(hash)
        return result as T
      })
      .catch(error => {
        this.#pendingRequests.delete(hash)
        logger.error(
          `Failed to compute result for hash: ${hash.substring(0, 8)}...`,
          error
        )
        throw error
      })

    this.#pendingRequests.set(hash, promise)
    return promise
  }

  clear(): void {
    this.#cache.clear()
    this.#pendingRequests.clear()
  }

  get size(): number {
    return this.#cache.size
  }
}
