import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'
import {
  vueOptionsDefault,
  vueOptionsDefineComponent
} from '../fixtures/vue2/options'
import { vueOptionsAPI, vueOptionsSimple } from '../fixtures/vue3/options'
import { vue27Composition } from '../fixtures/vue2/composition'
import {
  vueComponent,
  vueSetupScript,
  vueCompositionWithDefaults,
  vueSetupFunction,
  vueSpecialAPIs
} from '../fixtures/vue3/composition'

describe('MCP Code Parser - Vue Methods Extraction', () => {
  describe('Vue 2 Options API', () => {
    it('should extract methods from Vue 2 Options API component with export default', () => {
      const result = parseVue(vueOptionsDefault, 'test.vue')

      expect(result.optionsAPI?.methods).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.methods)).toBe(true)

      expect(result.optionsAPI?.methods?.length).toBeGreaterThan(0)
    })

    it('should extract methods from Vue 2 Options API component with defineComponent', () => {
      const result = parseVue(vueOptionsDefineComponent, 'test.vue')

      expect(result.optionsAPI?.methods).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.methods)).toBe(true)

      expect(result.optionsAPI?.methods?.length).toBeGreaterThan(0)
    })
  })

  describe('Vue 2 Composition API', () => {
    it('should extract methods from Vue 2 Composition API component', () => {
      const result = parseVue(vue27Composition, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)
      expect(result.compositionAPI?.methods?.length).toBeGreaterThan(0)
    })
  })

  describe('Vue 3 Composition API', () => {
    it('should extract methods from Vue 3 Composition API component', () => {
      const result = parseVue(vueComponent, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)
      expect(result.compositionAPI?.methods?.length).toBeGreaterThan(0)
    })

    it('should extract methods from Vue 3 Composition API component with setup script', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)
      expect(result.compositionAPI?.methods?.length).toBeGreaterThan(0)
    })

    it('should extract methods from Vue 3 Composition API component with defaults', () => {
      const result = parseVue(vueCompositionWithDefaults, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)
      expect(result.compositionAPI?.methods?.length).toBeGreaterThan(0)
    })

    it('should extract methods from Vue 3 Composition API component with setup function', () => {
      const result = parseVue(vueSetupFunction, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)
      expect(result.compositionAPI?.methods?.length).toBeGreaterThan(0)
    })

    it('should extract methods from Vue 3 Composition API component with special APIs', () => {
      const result = parseVue(vueSpecialAPIs, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)
      expect(result.compositionAPI?.methods?.length).toBeGreaterThan(0)
    })
  })

  describe('Vue 3 Options API', () => {
    it('should extract methods from Vue 3 Options API component with defineComponent', () => {
      const result = parseVue(vueOptionsAPI, 'test.vue')

      expect(result.optionsAPI?.methods).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.methods)).toBe(true)
      expect(result.optionsAPI?.methods?.length).toBeGreaterThan(0)
    })

    it('should extract methods from simple Vue 3 Options API component', () => {
      const result = parseVue(vueOptionsSimple, 'test.vue')

      expect(result.optionsAPI?.methods).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.methods)).toBe(true)
      expect(result.optionsAPI?.methods?.length).toBeGreaterThan(0)
    })
  })
})
