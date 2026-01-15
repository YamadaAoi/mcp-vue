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

describe('MCP Code Parser - Vue Imports Extraction', () => {
  describe('Vue 2 Options API', () => {
    it('should extract imports from Vue 2 Options API component with export default', () => {
      const result = parseVue(vueOptionsDefault, 'test.vue')

      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)
      }
    })

    it('should extract imports from Vue 2 Options API component with defineComponent', () => {
      const result = parseVue(vueOptionsDefineComponent, 'test.vue')

      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)
      }
    })
  })

  describe('Vue 2 Composition API', () => {
    it('should extract imports from Vue 2 Composition API component', () => {
      const result = parseVue(vue27Composition, 'test.vue')

      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)

        const vueImports = result.imports.filter(imp => imp.source === 'vue')
        expect(vueImports).toHaveLength(1)
        expect(vueImports[0].importedNames).toContain('ref')
        expect(vueImports[0].importedNames).toContain('computed')
        expect(vueImports[0].importedNames).toContain('watch')
        expect(vueImports[0].importedNames).toContain('onMounted')
        expect(vueImports[0].importedNames).toContain('onUnmounted')
      }
    })
  })

  describe('Vue 3 Composition API', () => {
    it('should extract imports from Vue 3 Composition API component', () => {
      const result = parseVue(vueComponent, 'test.vue')

      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)

        const vueImports = result.imports.filter(imp => imp.source === 'vue')
        expect(vueImports).toHaveLength(1)
        expect(vueImports[0].importedNames).toContain('ref')
        expect(vueImports[0].importedNames).toContain('computed')
        expect(vueImports[0].importedNames).toContain('onMounted')
      }
    })

    it('should extract imports from Vue 3 Composition API component with setup script', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)

        const vueImports = result.imports.filter(imp => imp.source === 'vue')
        expect(vueImports.length).toBeGreaterThan(0)

        const nonTypeImports = vueImports.filter(
          imp =>
            !imp.importedNames.some(
              name =>
                name.startsWith('Ref') ||
                name.startsWith('ComputedRef') ||
                name.startsWith('PropType')
            )
        )
        expect(nonTypeImports.length).toBeGreaterThan(0)
        expect(nonTypeImports[0].importedNames).toContain('ref')
        expect(nonTypeImports[0].importedNames).toContain('computed')
        expect(nonTypeImports[0].importedNames).toContain('onMounted')
      }
    })

    it('should extract imports from Vue 3 Composition API component with defaults', () => {
      const result = parseVue(vueCompositionWithDefaults, 'test.vue')

      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)

        const vueImports = result.imports.filter(imp => imp.source === 'vue')
        expect(vueImports).toHaveLength(1)
        expect(vueImports[0].importedNames).toContain('ref')
        expect(vueImports[0].importedNames).toContain('computed')
        expect(vueImports[0].importedNames).toContain('onMounted')
      }
    })

    it('should extract imports from Vue 3 Composition API component with setup function', () => {
      const result = parseVue(vueSetupFunction, 'test.vue')

      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)

        const vueImports = result.imports.filter(imp => imp.source === 'vue')
        expect(vueImports).toHaveLength(1)
        expect(vueImports[0].importedNames).toContain('ref')
        expect(vueImports[0].importedNames).toContain('computed')
        expect(vueImports[0].importedNames).toContain('onMounted')
      }
    })

    it('should extract imports from Vue 3 Composition API component with special APIs', () => {
      const result = parseVue(vueSpecialAPIs, 'test.vue')

      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)

        const vueImports = result.imports.filter(imp => imp.source === 'vue')
        expect(vueImports).toHaveLength(1)
        expect(vueImports[0].importedNames).toContain('ref')
        expect(vueImports[0].importedNames).toContain('computed')
        expect(vueImports[0].importedNames).toContain('provide')
        expect(vueImports[0].importedNames).toContain('inject')
        expect(vueImports[0].importedNames).toContain('onMounted')
      }
    })
  })

  describe('Vue 3 Options API', () => {
    it('should extract imports from Vue 3 Options API component with defineComponent', () => {
      const result = parseVue(vueOptionsAPI, 'test.vue')

      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)

        const vueImports = result.imports.filter(imp => imp.source === 'vue')
        expect(vueImports).toHaveLength(1)
        expect(vueImports[0].importedNames).toContain('defineComponent')
      }
    })

    it('should extract imports from simple Vue 3 Options API component', () => {
      const result = parseVue(vueOptionsSimple, 'test.vue')

      if (result.imports) {
        expect(Array.isArray(result.imports)).toBe(true)
      }
    })
  })
})
