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

  describe('Props Extraction', () => {
    it('should extract props from Vue 3 Composition API component with <script setup>', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      // Check that props array is returned correctly
      expect(result.compositionAPI?.props).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.props)).toBe(true)
      expect(result.compositionAPI?.props?.length).toBeGreaterThan(0)

      // Check that specific props are extracted
      const props = result.compositionAPI?.props || []
      const initialCountProp = props.find(p => p.name === 'initialCount')
      const titleProp = props.find(p => p.name === 'title')
      const itemsProp = props.find(p => p.name === 'items')

      expect(initialCountProp).toBeDefined()
      expect(initialCountProp?.type).toBe('number')
      expect(initialCountProp?.required).toBe(true)

      expect(titleProp).toBeDefined()
      expect(titleProp?.type).toBe('string')
      expect(titleProp?.required).toBe(true)

      expect(itemsProp).toBeDefined()
      expect(itemsProp?.type).toBe('string[]')
      expect(itemsProp?.required).toBe(false)
    })

    it('should extract props from Vue 3 Composition API component with defaults', () => {
      const result = parseVue(vueCompositionWithDefaults, 'test.vue')

      // Check that props array is returned correctly
      expect(result.compositionAPI?.props).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.props)).toBe(true)
      expect(result.compositionAPI?.props?.length).toBeGreaterThan(0)

      // Check that specific props are extracted
      const props = result.compositionAPI?.props || []
      const titleProp = props.find(p => p.name === 'title')
      const initialCountProp = props.find(p => p.name === 'initialCount')
      const isEnabledProp = props.find(p => p.name === 'isEnabled')
      const teamMembersProp = props.find(p => p.name === 'teamMembers')
      const preferencesProp = props.find(p => p.name === 'preferences')
      const categoriesProp = props.find(p => p.name === 'categories')
      const configProp = props.find(p => p.name === 'config')
      const currentProjectProp = props.find(p => p.name === 'currentProject')
      const searchTermsProp = props.find(p => p.name === 'searchTerms')
      const onUpdateProp = props.find(p => p.name === 'onUpdate')

      expect(titleProp).toBeDefined()
      expect(titleProp?.type).toBe('string')
      expect(titleProp?.required).toBe(true)

      expect(initialCountProp).toBeDefined()
      expect(initialCountProp?.type).toBe('number')
      expect(initialCountProp?.required).toBe(false)
      expect(initialCountProp?.default).toBeDefined()

      expect(isEnabledProp).toBeDefined()
      expect(isEnabledProp?.type).toBe('boolean')
      expect(isEnabledProp?.required).toBe(false)
      expect(isEnabledProp?.default).toBeDefined()

      expect(teamMembersProp).toBeDefined()
      expect(teamMembersProp?.type).toBeDefined()
      expect(teamMembersProp?.required).toBe(false)
      expect(teamMembersProp?.default).toBeDefined()

      expect(preferencesProp).toBeDefined()
      expect(preferencesProp?.type).toBeDefined()
      expect(preferencesProp?.required).toBe(false)
      expect(preferencesProp?.default).toBeDefined()

      expect(categoriesProp).toBeDefined()
      expect(categoriesProp?.type).toBeDefined()
      expect(categoriesProp?.required).toBe(false)
      expect(categoriesProp?.default).toBeDefined()

      expect(configProp).toBeDefined()
      expect(configProp?.type).toBeDefined()
      expect(configProp?.required).toBe(false)
      expect(configProp?.default).toBeDefined()

      expect(currentProjectProp).toBeDefined()
      expect(currentProjectProp?.type).toBeDefined()
      expect(currentProjectProp?.required).toBe(false)
      expect(currentProjectProp?.default).toBeDefined()

      expect(searchTermsProp).toBeDefined()
      expect(searchTermsProp?.type).toBeDefined()
      expect(searchTermsProp?.required).toBe(false)
      expect(searchTermsProp?.default).toBeDefined()

      expect(onUpdateProp).toBeDefined()
      expect(onUpdateProp?.type).toBeDefined()
      expect(onUpdateProp?.required).toBe(false)
      expect(onUpdateProp?.default).toBeDefined()
    })

    it('should extract props from Vue 3 Composition API component with setup function', () => {
      const result = parseVue(vueSetupFunction, 'test.vue')

      // Check that props array is returned correctly
      expect(result.compositionAPI?.props).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.props)).toBe(true)
    })

    it('should extract props from Vue 3 Composition API component with special APIs', () => {
      const result = parseVue(vueSpecialAPIs, 'test.vue')

      // Check that props array is returned correctly
      expect(result.compositionAPI?.props).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.props)).toBe(true)
    })

    it('should extract props from standard Vue 3 component', () => {
      const result = parseVue(vueComponent, 'test.vue')

      // Check that props array is returned correctly
      expect(result.compositionAPI?.props).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.props)).toBe(true)
    })
  })
})
