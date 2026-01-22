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

describe('MCP Code Parser - Vue Lifecycle Hooks Extraction', () => {
  describe('Vue 2 Options API', () => {
    it('should extract lifecycle hooks from Vue 2 Options API component with export default', () => {
      const result = parseVue(vueOptionsDefault, 'test.vue')

      expect(result.optionsAPI?.lifecycleHooks).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.lifecycleHooks)).toBe(true)
      expect(result.optionsAPI?.lifecycleHooks?.length).toBeGreaterThan(0)

      const hooks = result.optionsAPI?.lifecycleHooks || []
      const hookNames = hooks.map(h => h.name)

      expect(hookNames).toContain('beforeCreate')
      expect(hookNames).toContain('created')
      expect(hookNames).toContain('beforeMount')
      expect(hookNames).toContain('mounted')
      expect(hookNames).toContain('beforeUpdate')
      expect(hookNames).toContain('updated')
      expect(hookNames).toContain('beforeDestroy')
      expect(hookNames).toContain('destroyed')
      expect(hookNames).toContain('activated')
      expect(hookNames).toContain('deactivated')
      expect(hookNames).toContain('errorCaptured')
    })

    it('should extract lifecycle hooks from Vue 2 Options API component with defineComponent', () => {
      const result = parseVue(vueOptionsDefineComponent, 'test.vue')

      expect(result.optionsAPI?.lifecycleHooks).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.lifecycleHooks)).toBe(true)
      expect(result.optionsAPI?.lifecycleHooks?.length).toBeGreaterThan(0)
    })
  })

  describe('Vue 2 Composition API', () => {
    it('should extract lifecycle hooks from Vue 2 Composition API component', () => {
      const result = parseVue(vue27Composition, 'test.vue')

      expect(result.compositionAPI?.lifecycleHooks).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.lifecycleHooks)).toBe(true)
      expect(result.compositionAPI?.lifecycleHooks?.length).toBeGreaterThan(0)

      const hooks = result.compositionAPI?.lifecycleHooks || []
      const hookNames = hooks.map(h => h.name)

      expect(hookNames).toContain('onMounted')
      expect(hookNames).toContain('onUnmounted')
    })
  })

  describe('Vue 3 Composition API', () => {
    it('should extract lifecycle hooks from Vue 3 Composition API component', () => {
      const result = parseVue(vueComponent, 'test.vue')

      expect(result.compositionAPI?.lifecycleHooks).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.lifecycleHooks)).toBe(true)
      expect(result.compositionAPI?.lifecycleHooks?.length).toBeGreaterThan(0)
    })

    it('should extract lifecycle hooks from Vue 3 Composition API component with setup script', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.lifecycleHooks).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.lifecycleHooks)).toBe(true)
      expect(result.compositionAPI?.lifecycleHooks?.length).toBeGreaterThan(0)

      const hooks = result.compositionAPI?.lifecycleHooks || []
      const hookNames = hooks.map(h => h.name)

      expect(hookNames).toContain('onMounted')
      expect(hookNames).toContain('onUnmounted')
    })

    it('should extract lifecycle hooks from Vue 3 Composition API component with defaults', () => {
      const result = parseVue(vueCompositionWithDefaults, 'test.vue')

      expect(result.compositionAPI?.lifecycleHooks).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.lifecycleHooks)).toBe(true)
      expect(result.compositionAPI?.lifecycleHooks?.length).toBeGreaterThan(0)
    })

    it('should extract lifecycle hooks from Vue 3 Composition API component with setup function', () => {
      const result = parseVue(vueSetupFunction, 'test.vue')

      expect(result.compositionAPI?.lifecycleHooks).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.lifecycleHooks)).toBe(true)
      expect(result.compositionAPI?.lifecycleHooks?.length).toBeGreaterThan(0)
    })

    it('should extract lifecycle hooks from Vue 3 Composition API component with special APIs', () => {
      const result = parseVue(vueSpecialAPIs, 'test.vue')

      expect(result.compositionAPI?.lifecycleHooks).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.lifecycleHooks)).toBe(true)
      expect(result.compositionAPI?.lifecycleHooks?.length).toBeGreaterThan(0)

      const hooks = result.compositionAPI?.lifecycleHooks || []
      const hookNames = hooks.map(h => h.name)

      expect(hookNames).toContain('onMounted')
    })
  })

  describe('Vue 3 Options API', () => {
    it('should extract lifecycle hooks from Vue 3 Options API component with defineComponent', () => {
      const result = parseVue(vueOptionsAPI, 'test.vue')

      expect(result.optionsAPI?.lifecycleHooks).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.lifecycleHooks)).toBe(true)
      expect(result.optionsAPI?.lifecycleHooks?.length).toBeGreaterThan(0)

      const hooks = result.optionsAPI?.lifecycleHooks || []
      const hookNames = hooks.map(h => h.name)

      expect(hookNames).toContain('mounted')
      expect(hookNames).toContain('beforeUnmount')
    })

    it('should extract lifecycle hooks from simple Vue 3 Options API component', () => {
      const result = parseVue(vueOptionsSimple, 'test.vue')

      expect(result.optionsAPI?.lifecycleHooks).toBeDefined()
      expect(Array.isArray(result.optionsAPI?.lifecycleHooks)).toBe(true)
      expect(result.optionsAPI?.lifecycleHooks?.length).toBeGreaterThan(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle component without lifecycle hooks', () => {
      const code = `
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.lifecycleHooks).toBeUndefined()
    })

    it('should extract lifecycle hooks with parameters', () => {
      const result = parseVue(vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.lifecycleHooks).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.lifecycleHooks)).toBe(true)
      expect(result.compositionAPI?.lifecycleHooks?.length).toBeGreaterThan(0)

      const hooks = result.compositionAPI?.lifecycleHooks || []
      const onMountedHook = hooks.find(h => h.name === 'onMounted')

      expect(onMountedHook).toBeDefined()
      expect(onMountedHook?.parameters).toBeDefined()
      expect(Array.isArray(onMountedHook?.parameters)).toBe(true)
    })
  })
})
