import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'
import { vue2Options, vue3Composition, vue2Composition } from '../fixtures'

describe('MCP Code Parser - Vue Variables Extraction', () => {
  describe('Vue 2 Options API', () => {
    it('should extract variables from Vue 2 Options API component', () => {
      const result = parseVue(vue2Options.vueOptionsDefault, 'test.vue')

      expect(result.optionsAPI?.dataProperties).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.dataProperties)).toBe(true)
      expect(result.optionsAPI?.dataProperties?.length).toBeGreaterThan(0)

      const dataProps = result.optionsAPI?.dataProperties || []
      const dataNames = dataProps.map(d => d.name)

      expect(dataNames).toContain('internalCount')
      expect(dataNames).toContain('text')
      expect(dataNames).toContain('isActive')
      expect(dataNames).toContain('user')
    })

    it('should extract variables from simple Vue 2 Options API component', () => {
      const result = parseVue(vue2Options.vueOptionsPropsDefaults, 'test.vue')

      expect(result.optionsAPI?.dataProperties).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.dataProperties)).toBe(true)
    })
  })

  describe('Vue 2 Composition API', () => {
    it('should extract variables from Vue 2 Composition API component', () => {
      const result = parseVue(vue2Composition.vue27Composition, 'test.vue')

      expect(result.compositionAPI?.variables).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.variables)).toBe(true)
      expect(result.compositionAPI?.variables?.length).toBeGreaterThan(0)

      const variables = result.compositionAPI?.variables || []
      const variableNames = variables.map(v => v.name)

      expect(variableNames).toContain('count')
      expect(variableNames).toContain('message')
      expect(variableNames).toContain('isActive')
      expect(variableNames).toContain('doubledCount')
      expect(variableNames).toContain('fullTitle')
    })
  })

  describe('Vue 3 Composition API', () => {
    it('should extract variables from Vue 3 Composition API component with defaults', () => {
      const result = parseVue(vue3Composition.vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.variables).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.variables)).toBe(true)
      expect(result.compositionAPI?.variables?.length).toBeGreaterThan(0)

      const variables = result.compositionAPI?.variables || []
      const variableNames = variables.map(v => v.name)

      expect(variableNames).toContain('count')
      expect(variableNames).toContain('message')
      expect(variableNames).toContain('isLoading')
      expect(variableNames).toContain('user')
    })

    it('should extract variables from Vue 3 Composition API component with setup function', () => {
      const result = parseVue(vue3Composition.vueSetupFunction, 'test.vue')

      expect(result.compositionAPI?.variables).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.variables)).toBe(true)
      expect(result.compositionAPI?.variables?.length).toBeGreaterThan(0)

      const variables = result.compositionAPI?.variables || []
      const variableNames = variables.map(v => v.name)

      expect(variableNames).toContain('count')
      expect(variableNames).toContain('isLoading')
      expect(variableNames).toContain('error')
    })
  })

  describe('Edge cases', () => {
    it('should handle component without variables', () => {
      const code = `
        <script>
        export default {
          name: 'EmptyComponent'
        }
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.optionsAPI?.dataProperties).toBeUndefined()
    })

    it('should extract variable types', () => {
      const code = `
        <script setup>
        const message = 'Hello'
        const count = 0
        const isActive = true
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.variables).toBeDefined()
      const variables = result.compositionAPI?.variables || []

      const messageVar = variables.find(v => v.name === 'message')
      const countVar = variables.find(v => v.name === 'count')
      const isActiveVar = variables.find(v => v.name === 'isActive')

      expect(messageVar?.type).toBeUndefined()
      expect(countVar?.type).toBeUndefined()
      expect(isActiveVar?.type).toBeUndefined()
    })

    it('should extract const vs let variables', () => {
      const code = `
        <script setup>
        const constant = 1
        let variable = 2
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.variables).toBeDefined()
      const variables = result.compositionAPI?.variables || []

      const constantVar = variables.find(v => v.name === 'constant')
      const variableVar = variables.find(v => v.name === 'variable')

      expect(constantVar?.isConst).toBe(true)
      expect(variableVar?.isConst).toBe(false)
    })

    it('should extract variable initial values', () => {
      const code = `
        <script setup>
        const message = 'Hello'
        const count = 0
        const isActive = true
        const empty = null
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.variables).toBeDefined()
      const variables = result.compositionAPI?.variables || []

      const messageVar = variables.find(v => v.name === 'message')
      const countVar = variables.find(v => v.name === 'count')
      const isActiveVar = variables.find(v => v.name === 'isActive')
      const emptyVar = variables.find(v => v.name === 'empty')

      expect(messageVar?.value).toBe('Hello')
      expect(countVar?.value).toBe(0)
      expect(isActiveVar?.value).toBe(true)
      expect(emptyVar?.value).toBe(null)
    })

    it('should extract variables with complex nested structures', () => {
      const code = `
        <script setup>
        const nestedObject = { user: { name: 'John', age: 30 } }
        const nestedArray = [1, [2, 3], 4]
        const mixedStructure = { items: [1, 2, 3], config: { enabled: true } }
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.variables).toBeDefined()
      const variables = result.compositionAPI?.variables || []

      expect(variables.find(v => v.name === 'nestedObject')).toBeDefined()
      expect(variables.find(v => v.name === 'nestedArray')).toBeDefined()
      expect(variables.find(v => v.name === 'mixedStructure')).toBeDefined()
    })

    it('should extract variables with special TypeScript types', () => {
      const code = `
        <script setup lang="ts">
        const stringVar: string = 'test'
        const numberVar: number = 123
        const booleanVar: boolean = true
        const unionVar: string | number = 'test'
        const tupleVar: [string, number] = ['test', 123]
        const literalVar: 'success' | 'error' = 'success'
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.variables).toBeDefined()
      const variables = result.compositionAPI?.variables || []

      expect(variables.find(v => v.name === 'stringVar')).toBeDefined()
      expect(variables.find(v => v.name === 'numberVar')).toBeDefined()
      expect(variables.find(v => v.name === 'booleanVar')).toBeDefined()
      expect(variables.find(v => v.name === 'unionVar')).toBeDefined()
      expect(variables.find(v => v.name === 'tupleVar')).toBeDefined()
      expect(variables.find(v => v.name === 'literalVar')).toBeDefined()
    })

    it('should extract variables with type assertions', () => {
      const code = `
        <script setup lang="ts">
        const anyVar = {} as any
        const stringAssertion = 123 as unknown as string
        const satisfiesAssertion = { name: 'test' } satisfies { name: string }
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.variables).toBeDefined()
      const variables = result.compositionAPI?.variables || []

      expect(variables.find(v => v.name === 'anyVar')).toBeDefined()
      expect(variables.find(v => v.name === 'stringAssertion')).toBeDefined()
      expect(variables.find(v => v.name === 'satisfiesAssertion')).toBeDefined()
    })

    it('should extract variables with template strings', () => {
      const code = `
        <script setup>
        const name = 'John'
        const greeting = \`Hello, \${name}!\`
        const complexTemplate = \`User: \${name}, Age: \${30}\`
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.variables).toBeDefined()
      const variables = result.compositionAPI?.variables || []

      const greetingVar = variables.find(v => v.name === 'greeting')
      const complexTemplateVar = variables.find(
        v => v.name === 'complexTemplate'
      )

      expect(greetingVar).toBeDefined()
      expect(complexTemplateVar).toBeDefined()
    })

    it('should extract variables with complex expressions', () => {
      const code = `
        <script setup>
        const a = 1
        const b = 2
        const sum = a + b
        const isGreater = a > b ? true : false
        const nestedExpression = (a + b) * 2
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.variables).toBeDefined()
      const variables = result.compositionAPI?.variables || []

      expect(variables.find(v => v.name === 'sum')).toBeDefined()
      expect(variables.find(v => v.name === 'isGreater')).toBeDefined()
      expect(variables.find(v => v.name === 'nestedExpression')).toBeDefined()
    })
  })
})
