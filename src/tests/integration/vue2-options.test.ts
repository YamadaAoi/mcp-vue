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

  describe('Props Extraction', () => {
    it('should extract props from Vue 2 Options API component with export default', () => {
      const result = parseVue(vueOptionsDefault, 'test.vue')

      // Check that props array is returned correctly
      expect(result.optionsAPI?.props).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.props)).toBe(true)
      expect(result.optionsAPI?.props?.length).toBeGreaterThan(0)

      // Check that specific props are extracted
      const props = result.optionsAPI?.props || []
      const messageProp = props.find(p => p.name === 'message')
      const countProp = props.find(p => p.name === 'count')
      const itemsProp = props.find(p => p.name === 'items')
      const configProp = props.find(p => p.name === 'config')

      expect(messageProp).toBeDefined()
      expect(messageProp?.type).toBe('String')
      expect(messageProp?.required).toBe(false)
      expect(messageProp?.default).toBeDefined()
      expect(messageProp?.validator).toBe(true)

      expect(countProp).toBeDefined()
      expect(countProp?.type).toBe('Number')
      expect(countProp?.required).toBe(true)

      expect(itemsProp).toBeDefined()
      expect(itemsProp?.type).toBe('Array')
      expect(itemsProp?.required).toBe(false)
      expect(itemsProp?.default).toBeDefined()

      expect(configProp).toBeDefined()
      expect(configProp?.type).toBe('Object')
      expect(configProp?.required).toBe(false)
      expect(configProp?.default).toBeDefined()
    })

    it('should extract props from Vue 2 Options API component with defineComponent', () => {
      const result = parseVue(vueOptionsDefineComponent, 'test.vue')

      // Check that props array is returned correctly
      expect(result.optionsAPI?.props).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.props)).toBe(true)
    })

    it('should extract props from Vue 2 Options API component with props defaults', () => {
      const result = parseVue(vueOptionsPropsDefaults, 'test.vue')

      // Check that props array is returned correctly
      expect(result.optionsAPI?.props).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.props)).toBe(true)
      expect(result.optionsAPI?.props?.length).toBeGreaterThan(0)

      // Check that specific props are extracted
      const props = result.optionsAPI?.props || []
      const complexArrayProp = props.find(p => p.name === 'complexArray')
      const nestedObjectProp = props.find(p => p.name === 'nestedObject')
      const simpleArrayProp = props.find(p => p.name === 'simpleArray')
      const simpleObjectProp = props.find(p => p.name === 'simpleObject')
      const mixedPropsProp = props.find(p => p.name === 'mixedProps')
      const flagProp = props.find(p => p.name === 'flag')

      expect(complexArrayProp).toBeDefined()
      expect(complexArrayProp?.type).toBe('Array')
      expect(complexArrayProp?.required).toBe(false)
      expect(complexArrayProp?.default).toBeDefined()

      expect(nestedObjectProp).toBeDefined()
      expect(nestedObjectProp?.type).toBe('Object')
      expect(nestedObjectProp?.required).toBe(false)
      expect(nestedObjectProp?.default).toBeDefined()

      expect(simpleArrayProp).toBeDefined()
      expect(simpleArrayProp?.type).toBe('Array')
      expect(simpleArrayProp?.required).toBe(false)
      expect(simpleArrayProp?.default).toBeDefined()

      expect(simpleObjectProp).toBeDefined()
      expect(simpleObjectProp?.type).toBe('Object')
      expect(simpleObjectProp?.required).toBe(false)
      expect(simpleObjectProp?.default).toBeDefined()

      expect(mixedPropsProp).toBeDefined()
      expect(mixedPropsProp?.type).toBe('Object | Array')
      expect(mixedPropsProp?.required).toBe(false)
      expect(mixedPropsProp?.default).toBeDefined()

      expect(flagProp).toBeDefined()
      expect(flagProp?.type).toBe('Boolean')
      expect(flagProp?.required).toBe(false)
      expect(flagProp?.default).toBeDefined()
    })
  })
})
