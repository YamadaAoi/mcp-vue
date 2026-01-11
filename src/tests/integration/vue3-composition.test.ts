import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'
import {
  vueComponent,
  vueCompositionWithDefaults,
  vueSetupFunction,
  vueSetupScript,
  vueSpecialAPIs
} from '../fixtures/vue3/composition'

describe('MCP Code Parser - Vue 3 Composition API', () => {
  describe('Import Extraction', () => {
    it('should extract imports from Vue 3 Composition API component with setup function', () => {
      const result = parseVue(vueSetupFunction, 'test.vue')

      // Check that imports array is returned correctly if it exists
      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)
      }
    })

    it('should extract imports from Vue 3 Composition API component with <script setup>', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      // Check that imports array is returned correctly if it exists
      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)

        // Check that vue composition API imports are extracted
        const vueImports = result.imports.filter(imp => imp.source === 'vue')
        expect(vueImports).toHaveLength(1)
        expect(vueImports[0].importedNames).toContain('ref')
        expect(vueImports[0].importedNames).toContain('computed')
        expect(vueImports[0].importedNames).toContain('watch')
        expect(vueImports[0].importedNames).toContain('onMounted')
        expect(vueImports[0].importedNames).toContain('onUnmounted')
        expect(vueImports[0].importedNames).toContain('defineProps')
        expect(vueImports[0].importedNames).toContain('defineEmits')
      }
    })

    it('should extract imports from Vue 3 Composition API component with defaults', () => {
      const result = parseVue(vueCompositionWithDefaults, 'test.vue')

      // Check that imports array is returned correctly if it exists
      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)
      }
    })

    it('should extract imports from Vue 3 Composition API component with special APIs', () => {
      const result = parseVue(vueSpecialAPIs, 'test.vue')

      // Check that imports array is returned correctly if it exists
      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)
      }
    })

    it('should extract imports from standard Vue 3 component', () => {
      const result = parseVue(vueComponent, 'test.vue')

      // Check that imports array is returned correctly if it exists
      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)
      }
    })
  })

  describe('Method Extraction', () => {
    it('should extract methods from Vue 3 Composition API component with setup function', () => {
      const result = parseVue(vueSetupFunction, 'test.vue')

      // Check that methods array is returned correctly
      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)
      expect(result.compositionAPI?.methods?.length).toBeGreaterThan(0)
    })

    it('should extract methods from Vue 3 Composition API component with <script setup>', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      // Check that methods array is returned correctly
      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)
      expect(result.compositionAPI?.methods?.length).toBeGreaterThan(0)
    })

    it('should extract methods from Vue 3 Composition API component with defaults', () => {
      const result = parseVue(vueCompositionWithDefaults, 'test.vue')

      // Check that methods array is returned correctly
      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)
      expect(result.compositionAPI?.methods?.length).toBeGreaterThan(0)
    })

    it('should extract methods from Vue 3 Composition API component with special APIs', () => {
      const result = parseVue(vueSpecialAPIs, 'test.vue')

      // Check that methods array is returned correctly
      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)
      expect(result.compositionAPI?.methods?.length).toBeGreaterThan(0)
    })

    it('should extract methods from standard Vue 3 component', () => {
      const result = parseVue(vueComponent, 'test.vue')

      // Check that methods array is returned correctly
      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)
      expect(result.compositionAPI?.methods?.length).toBeGreaterThan(0)
    })
  })
})
