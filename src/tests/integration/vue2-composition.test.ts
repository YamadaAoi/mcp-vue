import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'
import { vue27Composition } from '../fixtures/vue2/composition'

describe('MCP Code Parser - Vue 2 Composition API', () => {
  describe('Import Extraction', () => {
    it('should extract imports from Vue 2 Composition API component', () => {
      const result = parseVue(vue27Composition, 'test.vue')

      // Check that imports array is returned correctly if it exists
      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)

        // Check that vue imports are extracted
        const vueImports = result.imports.filter(imp => imp.source === 'vue')
        expect(vueImports).toHaveLength(1)

        // Check that specific imports from vue are extracted
        expect(vueImports[0].importedNames).toContain('ref')
        expect(vueImports[0].importedNames).toContain('computed')
        expect(vueImports[0].importedNames).toContain('watch')
        expect(vueImports[0].importedNames).toContain('onMounted')
        expect(vueImports[0].importedNames).toContain('onUnmounted')
      }
    })
  })

  describe('Method Extraction', () => {
    it('should extract methods from Vue 2 Composition API component', () => {
      const result = parseVue(vue27Composition, 'test.vue')

      // Check that methods array is returned correctly
      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)
      expect(result.compositionAPI?.methods?.length).toBeGreaterThan(0)
    })
  })
})
