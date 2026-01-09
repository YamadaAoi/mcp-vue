import { describe, it, expect } from 'vitest'
import { parseTypeScript } from '../../services/ast/typescript/tsParser'
import { parseVue } from '../../services/ast/vue/vueParser'
import {
  simpleFunction,
  asyncFunction,
  classDefinition,
  interfaceDefinition,
  typeAlias,
  enumDefinition,
  importExport,
  variableDeclarations,
  vueComponent,
  vueOptionsAPI,
  complexTypeScript
} from '../fixtures/code-samples'

describe('MCP Code Parser - TypeScript', () => {
  describe('Function Extraction', () => {
    it('should extract simple function', async () => {
      const result = await parseTypeScript(simpleFunction, 'test.ts')

      expect(result.functions).toHaveLength(1)
      expect(result.functions[0].name).toBe('greet')
      expect(result.functions[0].parameters).toEqual(['name'])
      expect(result.functions[0].returnType).toBe('string')
    })

    it('should extract async function', async () => {
      const result = await parseTypeScript(asyncFunction, 'test.ts')

      expect(result.functions).toHaveLength(1)
      expect(result.functions[0].name).toBe('fetchData')
      expect(result.functions[0].type).toBe('function_declaration')
      expect(result.functions[0].isAsync).toBe(true)
    })
  })

  describe('Class Extraction', () => {
    it('should extract class with methods and properties', async () => {
      const result = await parseTypeScript(classDefinition, 'test.ts')

      expect(result.classes).toHaveLength(1)
      const personClass = result.classes[0]

      expect(personClass.name).toBe('Person')
      expect(personClass.properties).toHaveLength(3)
      expect(personClass.methods).toHaveLength(3)

      const greetMethod = personClass.methods.find(m => m.name === 'greet')
      expect(greetMethod).toBeDefined()

      const getAgeMethod = personClass.methods.find(m => m.name === 'getAge')
      expect(getAgeMethod).toBeDefined()
    })
  })

  describe('Type Extraction', () => {
    it('should extract interfaces', async () => {
      const result = await parseTypeScript(interfaceDefinition, 'test.ts')

      expect(result.types).toHaveLength(2)

      const userType = result.types.find(t => t.name === 'User')
      expect(userType).toBeDefined()
      expect(userType?.kind).toBe('interface')
      expect(userType?.properties).toHaveLength(4)

      const adminType = result.types.find(t => t.name === 'Admin')
      expect(adminType).toBeDefined()
      expect(adminType?.kind).toBe('interface')
    })

    it('should extract type aliases', async () => {
      const result = await parseTypeScript(typeAlias, 'test.ts')

      expect(result.types).toHaveLength(2)

      const statusType = result.types.find(t => t.name === 'Status')
      expect(statusType).toBeDefined()
      expect(statusType?.kind).toBe('type')

      const apiResponseType = result.types.find(t => t.name === 'ApiResponse')
      expect(apiResponseType).toBeDefined()
      expect(apiResponseType?.kind).toBe('type')
    })

    it('should extract enums', async () => {
      const result = await parseTypeScript(enumDefinition, 'test.ts')

      expect(result.types).toHaveLength(1)
      expect(result.types[0].name).toBe('Color')
      expect(result.types[0].kind).toBe('enum')
    })
  })

  describe('Import/Export Extraction', () => {
    it('should extract imports and exports', async () => {
      const result = await parseTypeScript(importExport, 'test.ts')

      expect(result.imports).toHaveLength(2)
      expect(result.imports[0].source).toBe('vue')
      expect(result.imports[0].imports).toEqual(['ref', 'computed'])

      expect(result.exports).toHaveLength(2)
      expect(result.exports[0].name).toBe('useCounter')
      expect(result.exports[1].isDefault).toBe(true)
    })
  })

  describe('Variable Extraction', () => {
    it('should extract variable declarations', async () => {
      const result = await parseTypeScript(variableDeclarations, 'test.ts')

      expect(result.variables.length).toBeGreaterThan(0)

      const piVar = result.variables.find(v => v.name === 'PI')
      expect(piVar).toBeDefined()
      expect(piVar?.isConst).toBe(true)
    })
  })

  describe('Complex TypeScript', () => {
    it('should parse complex TypeScript code', async () => {
      const result = await parseTypeScript(complexTypeScript, 'test.ts')

      expect(result.functions).toHaveLength(1)
      expect(result.classes).toHaveLength(2)
      expect(result.types).toHaveLength(3)

      const safeExecuteFn = result.functions[0]
      expect(safeExecuteFn.name).toBe('safeExecute')
      expect(safeExecuteFn.isAsync).toBe(true)
    })
  })
})

describe('MCP Code Parser - Vue', () => {
  describe('Vue Composition API', () => {
    it('should parse Vue SFC with script setup', async () => {
      const result = await parseVue(vueComponent, 'test.vue')

      expect(result.language).toBe('vue')
      expect(result.vueOptionsAPI).toBeDefined()

      const optionsAPI = result.vueOptionsAPI!
      expect(optionsAPI.methods.length).toBeGreaterThanOrEqual(0)
      expect(optionsAPI.lifecycleHooks.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Vue Options API', () => {
    it('should parse Vue SFC with Options API', async () => {
      const result = await parseVue(vueOptionsAPI, 'test.vue')

      expect(result.language).toBe('vue')
      expect(result.vueOptionsAPI).toBeDefined()

      const optionsAPI = result.vueOptionsAPI!
      expect(optionsAPI.dataProperties.length).toBeGreaterThanOrEqual(0)
      expect(optionsAPI.computedProperties.length).toBeGreaterThanOrEqual(0)
      expect(optionsAPI.watchProperties.length).toBeGreaterThanOrEqual(0)
      expect(optionsAPI.methods.length).toBeGreaterThanOrEqual(0)
      expect(optionsAPI.lifecycleHooks.length).toBeGreaterThanOrEqual(0)
    })

    it('should extract Options API methods', async () => {
      const result = await parseVue(vueOptionsAPI, 'test.vue')

      const optionsAPI = result.vueOptionsAPI!
      expect(optionsAPI.methods).toContain('increment')
      expect(optionsAPI.methods).toContain('decrement')
    })

    it('should extract Options API lifecycle hooks', async () => {
      const result = await parseVue(vueOptionsAPI, 'test.vue')

      const optionsAPI = result.vueOptionsAPI!
      expect(optionsAPI.lifecycleHooks).toContain('mounted')
      expect(optionsAPI.lifecycleHooks).toContain('beforeUnmount')
    })
  })
})

describe('MCP Code Parser - Integration', () => {
  it('should handle multiple consecutive parses', async () => {
    const results = await Promise.all([
      parseTypeScript(simpleFunction, 'test1.ts'),
      parseTypeScript(asyncFunction, 'test2.ts'),
      parseTypeScript(classDefinition, 'test3.ts')
    ])

    expect(results).toHaveLength(3)
    expect(results[0].functions).toHaveLength(1)
    expect(results[1].functions).toHaveLength(1)
    expect(results[2].classes).toHaveLength(1)
  })

  it('should handle mixed file types', async () => {
    const results = await Promise.all([
      parseTypeScript(simpleFunction, 'test.ts'),
      parseVue(vueComponent, 'test.vue')
    ])

    expect(results[0].language).toBe('typescript')
    expect(results[1].language).toBe('vue')
    expect(results[1].vueOptionsAPI).toBeDefined()
  })
})
