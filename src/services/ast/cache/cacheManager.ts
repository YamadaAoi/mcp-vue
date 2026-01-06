import { createHash } from 'node:crypto'
import type { ParseResult, CacheEntry } from '../types'

export class CacheManager {
  #cache: Map<string, CacheEntry> = new Map()
  #maxCacheSize: number
  #cacheTTL: number
  #pendingRequests: Map<string, Promise<unknown>> = new Map()

  constructor(maxCacheSize = 100, cacheTTL = 5 * 60 * 1000) {
    this.#maxCacheSize = maxCacheSize
    this.#cacheTTL = cacheTTL
  }

  generateHash(code: string): string {
    return createHash('sha256').update(code).digest('hex')
  }

  getFromCache(hash: string): ParseResult | null {
    const entry = this.#cache.get(hash)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > this.#cacheTTL) {
      this.#cache.delete(hash)
      return null
    }

    return entry.result
  }

  setCache(hash: string, result: ParseResult): void {
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
  }

  async getOrCompute<T>(
    hash: string,
    compute: () => T | Promise<T>
  ): Promise<T> {
    const cached = this.getFromCache(hash)
    if (cached) {
      return cached as T
    }

    const existingPromise = this.#pendingRequests.get(hash)
    if (existingPromise) {
      return existingPromise as Promise<T>
    }

    const promise = Promise.resolve(compute())
      .then(result => {
        this.setCache(hash, result as ParseResult)
        this.#pendingRequests.delete(hash)
        return result as T
      })
      .catch(error => {
        this.#pendingRequests.delete(hash)
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
