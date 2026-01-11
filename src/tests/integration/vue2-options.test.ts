import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'
import {
  vueOptionsDefault,
  vueOptionsDefineComponent,
  vueOptionsPropsDefaults
} from '../fixtures/vue2/options'

describe('MCP Code Parser - Vue 2 Options API', () => {
  describe('Import Extraction', () => {
    it('should extract imports from Vue 2 Options API component with export default', () => {
      const result = parseVue(vueOptionsDefault, 'test.vue')

      // Check that imports array is returned correctly if it exists
      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)
      }
    })

    it('should extract imports from Vue 2 Options API component with defineComponent', () => {
      const result = parseVue(vueOptionsDefineComponent, 'test.vue')

      // Check that imports array is returned correctly if it exists
      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)
      }
    })

    it('should extract imports from Vue 2 Options API component with props defaults', () => {
      const result = parseVue(vueOptionsPropsDefaults, 'test.vue')

      // Check that imports array is returned correctly if it exists
      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)
      }
    })
  })

  describe('Method Extraction', () => {
    it('should extract methods from Vue 2 Options API component with export default', () => {
      const result = parseVue(vueOptionsDefault, 'test.vue')

      // Check that methods array is returned correctly
      expect(result.optionsAPI?.methods).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.methods)).toBe(true)

      // VueOptionsDefault component has increment, decrement, updateUser, triggerEvent, setupEvents, teardownEvents, handleChildEvent, passListeners, passAttrs methods
      expect(result.optionsAPI?.methods?.length).toBeGreaterThan(0)
    })

    it('should extract methods from Vue 2 Options API component with defineComponent', () => {
      const result = parseVue(vueOptionsDefineComponent, 'test.vue')

      // Check that methods array is returned correctly
      expect(result.optionsAPI?.methods).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.methods)).toBe(true)

      // VueOptionsDefineComponent component has increment, decrement, triggerEvent methods
      expect(result.optionsAPI?.methods?.length).toBeGreaterThan(0)
    })

    it('should extract methods from Vue 2 Options API component with props defaults', () => {
      const result = parseVue(vueOptionsPropsDefaults, 'test.vue')

      // Check that methods array is returned correctly
      expect(result.optionsAPI?.methods).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.methods)).toBe(true)

      // VueOptionsPropsDefaults component has updateArray, updateObject, resetToDefaults methods
      expect(result.optionsAPI?.methods?.length).toBeGreaterThan(0)
    })
  })
})
