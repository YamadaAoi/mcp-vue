import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '../../services/ast/typescript/tsParser'
import { parseVue } from '../../services/ast/vue/vueParser'
import { simpleFunction, asyncFunction, classDefinition } from '../fixtures/ts'
import { vueOptionsAPI } from '../fixtures/vue3/options'

describe('MCP Code Parser - Integration', () => {
  it('should handle multiple consecutive parses', async () => {
    const results = await Promise.all([
      parseTypeScript(simpleFunction, 'test1.ts'),
      parseTypeScript(asyncFunction, 'test2.ts'),
      parseTypeScript(classDefinition, 'test3.ts')
    ])

    expect(results).toHaveLength(3)
    expect(results[0].functions).toHaveLength(1)
    expect(results[1].functions).toHaveLength(1)
    expect(results[2].classes).toHaveLength(1)
  })

  it('should handle mixed file types', async () => {
    const results = await Promise.all([
      parseTypeScript(simpleFunction, 'test.ts'),
      parseVue(vueOptionsAPI, 'test.vue')
    ])

    expect(results[0].language).toBe('typescript')
    expect(results[1].language).toBe('vue')
    expect(results[1].optionsAPI).toBeDefined()
  })
})
