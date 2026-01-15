import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'
import {
  vueOptionsDefault,
  vueOptionsPropsDefaults as vue2OptionsPropsDefaults
} from '../fixtures/vue2/options'
import {
  vueOptionsAPI,
  vueOptionsPropsDefaults,
  vueOptionsSimple
} from '../fixtures/vue3/options'
import { vue27Composition } from '../fixtures/vue2/composition'
import {
  vueComponent,
  vueSetupScript,
  vueCompositionWithDefaults,
  vueSetupFunction,
  vueSpecialAPIs
} from '../fixtures/vue3/composition'

describe('MCP Code Parser - Vue Props Extraction', () => {
  describe('Vue 2 Options API', () => {
    it('should extract props from Vue 2 Options API component with export default', () => {
      const result = parseVue(vueOptionsDefault, 'test.vue')

      expect(result.optionsAPI?.props).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.props)).toBe(true)
      expect(result.optionsAPI?.props?.length).toBeGreaterThan(0)

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

    it('should extract props from Vue 2 Options API component with props defaults', () => {
      const result = parseVue(vue2OptionsPropsDefaults, 'test.vue')

      expect(result.optionsAPI?.props).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.props)).toBe(true)
      expect(result.optionsAPI?.props?.length).toBeGreaterThan(0)

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

  describe('Vue 2 Composition API', () => {
    it('should extract props from Vue 2 Composition API component', () => {
      const result = parseVue(vue27Composition, 'test.vue')

      expect(result.compositionAPI?.props).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.props)).toBe(true)
      expect(result.compositionAPI?.props?.length).toBeGreaterThan(0)
    })
  })

  describe('Vue 3 Composition API', () => {
    it('should extract props from Vue 3 Composition API component', () => {
      const result = parseVue(vueComponent, 'test.vue')

      expect(result.compositionAPI?.props).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.props)).toBe(true)
    })

    it('should extract props from Vue 3 Composition API component with setup script', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.props).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.props)).toBe(true)
      expect(result.compositionAPI?.props?.length).toBeGreaterThan(0)
    })

    it('should extract props from Vue 3 Composition API component with defaults', () => {
      const result = parseVue(vueCompositionWithDefaults, 'test.vue')

      expect(result.compositionAPI?.props).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.props)).toBe(true)
      expect(result.compositionAPI?.props?.length).toBeGreaterThan(0)
    })

    it('should extract props from Vue 3 Composition API component with setup function', () => {
      const result = parseVue(vueSetupFunction, 'test.vue')

      expect(result.compositionAPI?.props).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.props)).toBe(true)
      expect(result.compositionAPI?.props?.length).toBeGreaterThan(0)
    })
  })

  describe('Vue 3 Options API', () => {
    it('should extract props from Vue 3 Options API component with defineComponent', () => {
      const result = parseVue(vueOptionsAPI, 'test.vue')

      expect(result.optionsAPI?.props).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.props)).toBe(true)
    })

    it('should extract props from Vue 3 Options API component with props defaults', () => {
      const result = parseVue(vueOptionsPropsDefaults, 'test.vue')

      expect(result.optionsAPI?.props).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.props)).toBe(true)
      expect(result.optionsAPI?.props?.length).toBeGreaterThan(0)
    })

    it('should extract props from simple Vue 3 Options API component', () => {
      const result = parseVue(vueOptionsSimple, 'test.vue')

      expect(result.optionsAPI?.props).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.props)).toBe(true)
    })
  })
})
