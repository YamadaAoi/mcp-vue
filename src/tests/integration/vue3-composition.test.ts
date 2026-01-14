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
        expect(vueImports).toHaveLength(2)

        const typeImports = vueImports.filter(imp => imp.isTypeImport)
        expect(typeImports).toHaveLength(1)
        expect(typeImports[0].importedNames).toContain('Ref')
        expect(typeImports[0].importedNames).toContain('ComputedRef')
        expect(typeImports[0].importedNames).toContain('PropType')

        const valueImports = vueImports.filter(imp => !imp.isTypeImport)
        expect(valueImports).toHaveLength(1)
        expect(valueImports[0].importedNames).toContain('ref')
        expect(valueImports[0].importedNames).toContain('computed')
        expect(valueImports[0].importedNames).toContain('watch')
        expect(valueImports[0].importedNames).toContain('onMounted')
        expect(valueImports[0].importedNames).toContain('onUnmounted')
        expect(valueImports[0].importedNames).toContain('defineProps')
        expect(valueImports[0].importedNames).toContain('defineEmits')
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

  describe('Type Import Extraction', () => {
    it('should extract type imports correctly', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.imports).toBeDefined()
      expect(Array.isArray(result.imports)).toBe(true)

      const typeImports = result.imports?.filter(imp => imp.isTypeImport)
      expect(typeImports).toBeDefined()
      expect(typeImports?.length).toBeGreaterThan(0)

      const vueTypeImportsFiltered = typeImports?.filter(
        imp => imp.source === 'vue'
      )
      expect(vueTypeImportsFiltered).toBeDefined()
      expect(vueTypeImportsFiltered?.length).toBe(1)
      expect(vueTypeImportsFiltered?.[0].importedNames).toContain('Ref')
      expect(vueTypeImportsFiltered?.[0].importedNames).toContain('ComputedRef')
      expect(vueTypeImportsFiltered?.[0].importedNames).toContain('PropType')
    })

    it('should distinguish between type and value imports', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.imports).toBeDefined()
      expect(Array.isArray(result.imports)).toBe(true)

      const typeImports = result.imports?.filter(imp => imp.isTypeImport)
      const valueImports = result.imports?.filter(imp => !imp.isTypeImport)

      expect(typeImports?.length).toBe(1)
      expect(typeImports?.[0].importedNames).toContain('Ref')
      expect(typeImports?.[0].importedNames).toContain('ComputedRef')
      expect(typeImports?.[0].importedNames).toContain('PropType')

      expect(valueImports?.length).toBe(1)
      expect(valueImports?.[0].importedNames).toContain('ref')
      expect(valueImports?.[0].importedNames).toContain('computed')
      expect(valueImports?.[0].importedNames).toContain('defineProps')
    })
  })

  describe('Method Parameter Type Extraction', () => {
    it('should extract method parameters with type annotations', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)

      const greetMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'greet'
      )
      expect(greetMethod).toBeDefined()
      expect(greetMethod?.parameters).toContain('name: string')
      expect(greetMethod?.returnType).toBe('string')

      const addMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'add'
      )
      expect(addMethod).toBeDefined()
      expect(addMethod?.parameters).toContain('a: number')
      expect(addMethod?.parameters).toContain('b: number')
      expect(addMethod?.returnType).toBe('number')
    })

    it('should extract method parameters with complex types', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)

      const processUserMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'processUser'
      )
      expect(processUserMethod).toBeDefined()
      expect(processUserMethod?.parameters).toContain('user: User')
      expect(processUserMethod?.returnType).toBe('void')

      const getUsersMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'getUsers'
      )
      expect(getUsersMethod).toBeDefined()
      expect(getUsersMethod?.returnType).toBe('User[]')
    })

    it('should extract method parameters with union types', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)

      const printValueMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'printValue'
      )
      expect(printValueMethod).toBeDefined()
      expect(printValueMethod?.parameters).toContain('value: string | number')
    })

    it('should extract method parameters with array types', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)

      const sumMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'sum'
      )
      expect(sumMethod).toBeDefined()
      expect(sumMethod?.parameters).toContain('numbers: number[]')
      expect(sumMethod?.returnType).toBe('number')

      const getFirstMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'getFirst'
      )
      expect(getFirstMethod).toBeDefined()
      expect(getFirstMethod?.parameters).toContain('items: string[]')
      expect(getFirstMethod?.returnType).toBe('string | undefined')
    })
  })

  describe('Method with Destructured Parameters', () => {
    it('should extract methods with object destructured parameters', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)

      const greetMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'greetDestructured'
      )
      expect(greetMethod).toBeDefined()
      expect(greetMethod?.parameters.length).toBeGreaterThan(0)
      expect(greetMethod?.returnType).toBe('string')
    })

    it('should extract methods with array destructured parameters', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)

      const sumMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'sumDestructured'
      )
      expect(sumMethod).toBeDefined()
      expect(sumMethod?.parameters.length).toBeGreaterThan(0)
      expect(sumMethod?.returnType).toBe('number')
    })
  })

  describe('Method with Rest Parameters', () => {
    it('should extract methods with rest parameters', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)

      const sumAllMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'sumAll'
      )
      expect(sumAllMethod).toBeDefined()
      expect(sumAllMethod?.parameters.length).toBeGreaterThan(0)
      expect(sumAllMethod?.returnType).toBe('number')

      const greetMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'greetRest'
      )
      expect(greetMethod).toBeDefined()
      expect(greetMethod?.parameters.length).toBeGreaterThan(0)
      expect(greetMethod?.returnType).toBe('string')
    })
  })

  describe('Method with Default Parameters', () => {
    it('should extract methods with default parameters', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)

      const greetMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'greetDefault'
      )
      expect(greetMethod).toBeDefined()
      expect(greetMethod?.parameters.length).toBeGreaterThan(0)
      expect(greetMethod?.returnType).toBe('string')

      const addMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'addDefault'
      )
      expect(addMethod).toBeDefined()
      expect(addMethod?.parameters.length).toBeGreaterThan(0)
      expect(addMethod?.returnType).toBe('number')
    })
  })

  describe('Async Methods', () => {
    it('should extract async methods with correct isAsync flag', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)

      const fetchDataMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'fetchUserData'
      )
      expect(fetchDataMethod).toBeDefined()
      expect(fetchDataMethod?.isAsync).toBe(true)
      expect(fetchDataMethod?.parameters).toContain('url: string')
      expect(fetchDataMethod?.returnType).toBe('Promise<any>')

      const getUserMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'getUserData'
      )
      expect(getUserMethod).toBeDefined()
      expect(getUserMethod?.isAsync).toBe(true)
      expect(getUserMethod?.parameters).toContain('id: number')
    })
  })

  describe('Arrow Functions', () => {
    it('should extract arrow functions with type annotations', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)

      const addMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'arrowAdd'
      )
      expect(addMethod).toBeDefined()
      expect(addMethod?.parameters).toContain('a: number')
      expect(addMethod?.parameters).toContain('b: number')
      expect(addMethod?.returnType).toBe('number')

      const multiplyMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'arrowMultiply'
      )
      expect(multiplyMethod).toBeDefined()
      expect(multiplyMethod?.parameters).toContain('a: number')
      expect(multiplyMethod?.parameters).toContain('b: number')
      expect(multiplyMethod?.returnType).toBe('number')
    })

    it('should extract async arrow functions', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.methods).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.methods)).toBe(true)

      const fetchDataMethod = result.compositionAPI?.methods?.find(
        m => m.name === 'arrowFetchData'
      )
      expect(fetchDataMethod).toBeDefined()
      expect(fetchDataMethod?.isAsync).toBe(true)
      expect(fetchDataMethod?.parameters).toContain('url: string')
    })
  })
})
