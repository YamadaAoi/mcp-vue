import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'
import { vue3Composition } from '../fixtures'

describe('MCP Code Parser - Vue Expose Extraction', () => {
  describe('Vue 3 Composition API - defineExpose', () => {
    it('should extract expose information from Vue 3 component with defineExpose', () => {
      const result = parseVue(vue3Composition.vueSpecialAPIs, 'test.vue')

      expect(result.compositionAPI?.expose).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.expose)).toBe(true)
      expect(result.compositionAPI?.expose?.length).toBeGreaterThan(0)

      const expose = result.compositionAPI?.expose || []
      const exposeNames = expose.map(e => e.name)

      // Check that all exposed items are extracted
      expect(exposeNames).toContain('count')
      expect(exposeNames).toContain('theme')
      expect(exposeNames).toContain('toggleTheme')
      expect(exposeNames).toContain('increment')
      expect(exposeNames).toContain('decrement')
      expect(exposeNames).toContain('reset')

      // Check that properties and methods are correctly identified
      // Note: In defineExpose, all values are treated as properties, including function references
      // This is because the value is a reference to a function, not a function definition
      const countExpose = expose.find(e => e.name === 'count')
      expect(countExpose?.type).toBe('property')

      const toggleThemeExpose = expose.find(e => e.name === 'toggleTheme')
      expect(toggleThemeExpose?.type).toBe('property')
    })

    it('should handle component without defineExpose', () => {
      const result = parseVue(vue3Composition.vueSetupScript, 'test.vue')

      expect(result.compositionAPI?.expose).toBeUndefined()
    })
  })

  describe('Vue 2 Composition API', () => {
    it("should not extract expose from Vue 2 Composition API (Vue 2 doesn't support defineExpose)", () => {
      const result = parseVue(
        vue3Composition.vueCompositionWithDefaults,
        'test.vue'
      )

      expect(result.compositionAPI?.expose).toBeUndefined()
    })
  })

  describe('Edge cases', () => {
    it('should handle empty defineExpose', () => {
      const code = `<script setup>
import { defineExpose } from 'vue'

defineExpose({})
</script>`

      const result = parseVue(code, 'test.vue')

      // Note: For optimization, expose is only added to the result if there are exposed items
      expect(result.compositionAPI?.expose).toBeUndefined()
    })

    it('should handle defineExpose with mixed property types', () => {
      const code = `<script setup>
import { defineExpose, ref } from 'vue'

const count = ref(0)
const message = 'Hello'
const isActive = ref(true)

function increment() {
  count.value++
}

const calculate = () => {
  return count.value * 2
}

defineExpose({
  count,
  message,
  isActive,
  increment,
  calculate
})
</script>`

      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.expose).toBeDefined()
      expect(result.compositionAPI?.expose?.length).toBe(5)

      const expose = result.compositionAPI?.expose || []
      // Note: In defineExpose, all exposed values are treated as properties, including function references
      // This is because we're exposing references to functions, not function definitions
      expect(expose.filter(e => e.type === 'property').length).toBe(5)
      expect(expose.filter(e => e.type === 'method').length).toBe(0)
    })
  })
})
