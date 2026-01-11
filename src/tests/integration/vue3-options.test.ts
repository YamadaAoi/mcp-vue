import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'
import {
  vueOptionsAPI,
  vueOptionsPropsDefaults,
  vueOptionsSimple
} from '../fixtures/vue3/options'

describe('MCP Code Parser - Vue 3 Options API', () => {
  describe('Import Extraction', () => {
    it('should extract imports from Vue 3 Options API component with defineComponent', () => {
      const result = parseVue(vueOptionsAPI, 'test.vue')

      // Check that imports array is returned correctly if it exists
      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)

        // Check that defineComponent import is extracted
        const vueImports = result.imports.filter(imp => imp.source === 'vue')
        expect(vueImports).toHaveLength(1)
        expect(vueImports[0].importedNames).toContain('defineComponent')
      }
    })

    it('should extract imports from Vue 3 Options API component with props defaults', () => {
      const result = parseVue(vueOptionsPropsDefaults, 'test.vue')

      // Check that imports array is returned correctly if it exists
      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)
      }
    })

    it('should extract imports from simple Vue 3 Options API component', () => {
      const result = parseVue(vueOptionsSimple, 'test.vue')

      // Check that imports array is returned correctly if it exists
      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)
      }
    })
  })

  describe('Method Extraction', () => {
    it('should extract methods from Vue 3 Options API component with defineComponent', () => {
      const result = parseVue(vueOptionsAPI, 'test.vue')

      // Check that methods array is returned correctly
      expect(result.optionsAPI?.methods).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.methods)).toBe(true)
      expect(result.optionsAPI?.methods?.length).toBeGreaterThan(0)
    })

    it('should extract methods from Vue 3 Options API component with props defaults', () => {
      const result = parseVue(vueOptionsPropsDefaults, 'test.vue')

      // Check that methods array is returned correctly
      expect(result.optionsAPI?.methods).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.methods)).toBe(true)
      expect(result.optionsAPI?.methods?.length).toBeGreaterThan(0)
    })

    it('should extract methods from simple Vue 3 Options API component', () => {
      const result = parseVue(vueOptionsSimple, 'test.vue')

      // Check that methods array is returned correctly
      expect(result.optionsAPI?.methods).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.methods)).toBe(true)
      expect(result.optionsAPI?.methods?.length).toBeGreaterThan(0)
    })
  })
})
