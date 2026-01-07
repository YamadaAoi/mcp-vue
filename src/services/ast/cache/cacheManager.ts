import type { ParseResult } from '../types'
import { getLogger } from '../../../utils/logger'

const logger = getLogger()

const DEFAULT_MAX_CACHE_SIZE = 100
const DEFAULT_CACHE_TTL = 5 * 60 * 1000

interface CacheEntry {
  key: string
  result: ParseResult
  timestamp: number
}

function isValidCacheKey(key: unknown): key is string {
  return typeof key === 'string' && key.length > 0
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

  getFromCache(key: string): ParseResult | null {
    if (!isValidCacheKey(key)) {
      logger.warn('Invalid cache key provided to getFromCache')
      return null
    }

    const entry = this.#cache.get(key)
    if (!entry) {
      logger.debug(`Cache miss for key: ${key.substring(0, 50)}...`)
      return null
    }

    const now = Date.now()
    if (now - entry.timestamp > this.#cacheTTL) {
      logger.debug(`Cache entry expired for key: ${key.substring(0, 50)}...`)
      this.#cache.delete(key)
      return null
    }

    const result = entry.result

    this.#cache.delete(key)
    this.#cache.set(key, entry)

    logger.debug(`Cache hit for key: ${key.substring(0, 50)}...`)
    return result
  }

  setCache(key: string, result: ParseResult): void {
    if (!isValidCacheKey(key)) {
      logger.warn('Invalid cache key provided to setCache')
      return
    }

    if (this.#cache.has(key)) {
      this.#cache.delete(key)
    }

    while (this.#cache.size >= this.#maxCacheSize) {
      const firstKey = this.#cache.keys().next().value
      if (firstKey) {
        this.#cache.delete(firstKey)
      } else {
        break
      }
    }

    this.#cache.set(key, {
      key,
      result,
      timestamp: Date.now()
    })

    logger.debug(`Cache entry set for key: ${key.substring(0, 50)}...`)
  }

  async getOrCompute<T>(
    key: string,
    compute: () => T | Promise<T>
  ): Promise<T> {
    if (!isValidCacheKey(key)) {
      logger.warn('Invalid cache key provided to getOrCompute')
      throw new Error('Invalid cache key provided')
    }

    const cached = this.getFromCache(key)
    if (cached) {
      return cached as T
    }

    const existingPromise = this.#pendingRequests.get(key)
    if (existingPromise) {
      logger.debug(`Using existing promise for key: ${key.substring(0, 50)}...`)
      return existingPromise as Promise<T>
    }

    logger.debug(`Computing result for key: ${key.substring(0, 50)}...`)
    const promise = Promise.resolve(compute())
      .then(result => {
        this.setCache(key, result as ParseResult)
        this.#pendingRequests.delete(key)
        return result as T
      })
      .catch(error => {
        this.#pendingRequests.delete(key)
        logger.error(
          `Failed to compute result for key: ${key.substring(0, 50)}...`,
          error
        )
        throw error
      })

    this.#pendingRequests.set(key, promise)
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
