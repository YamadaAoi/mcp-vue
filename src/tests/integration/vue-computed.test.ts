import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'
import { vue2Options, vue3Composition, vue2Composition } from '../fixtures'

describe('MCP Code Parser - Vue Computed Extraction (Composition API)', () => {
  describe('Vue 3 Composition API', () => {
    it('should extract computed properties from Vue 3 Composition API component with setup script', () => {
      const code = `
        <script setup>
        import { ref, computed } from 'vue'
        
        const count = ref(0)
        const doubleCount = computed(() => count.value * 2)
        const message = computed(() => count.value)
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.computed).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.computed)).toBe(true)
      expect(result.compositionAPI?.computed?.length).toBe(2)

      const computedProps = result.compositionAPI?.computed || []
      const computedNames = computedProps.map(c => c.name)

      expect(computedNames).toContain('doubleCount')
      expect(computedNames).toContain('message')

      const doubleCount = computedProps.find(c => c.name === 'doubleCount')
      expect(doubleCount?.isReadonly).toBe(true)
      expect(doubleCount?.hasSetter).toBe(false)
    })

    it('should extract computed properties with getter and setter', () => {
      const code = `
        <script setup>
        import { ref, computed } from 'vue'
        
        const count = ref(0)
        const doubleCount = computed({
          get: () => count.value * 2,
          set: (value) => { count.value = value / 2 }
        })
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.computed).toBeDefined()
      const computedProps = result.compositionAPI?.computed || []

      const doubleCount = computedProps.find(c => c.name === 'doubleCount')
      expect(doubleCount?.isReadonly).toBe(false)
      expect(doubleCount?.hasSetter).toBe(true)
    })

    it('should extract computed properties with TypeScript types', () => {
      const code = `
        <script setup lang="ts">
        import { ref, computed } from 'vue'
        
        const count = ref(0)
        const doubleCount: ComputedRef<number> = computed(() => count.value * 2)
        const message: ComputedRef<string> = computed(() => count.value)
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.computed).toBeDefined()
      const computedProps = result.compositionAPI?.computed || []

      expect(computedProps.find(c => c.name === 'doubleCount')).toBeDefined()
      expect(computedProps.find(c => c.name === 'message')).toBeDefined()
    })

    it('should extract computed properties from setup function', () => {
      const code = `
        <script>
        import { defineComponent, ref, computed } from 'vue'
        
        export default defineComponent({
          setup() {
            const count = ref(0)
            const doubleCount = computed(() => count.value * 2)
            
            return {
              count,
              doubleCount
            }
          }
        })
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.computed).toBeDefined()
      const computedProps = result.compositionAPI?.computed || []

      expect(computedProps.find(c => c.name === 'doubleCount')).toBeDefined()
    })
  })

  describe('Vue 2 Composition API', () => {
    it('should extract computed properties from Vue 2 Composition API component', () => {
      const code = `
        <script>
        import { ref, computed } from '@vue/composition-api'
        
        export default {
          setup() {
            const count = ref(0)
            const doubleCount = computed(() => count.value * 2)
            
            return {
              count,
              doubleCount
            }
          }
        }
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.computed).toBeDefined()
      const computedProps = result.compositionAPI?.computed || []

      expect(computedProps.find(c => c.name === 'doubleCount')).toBeDefined()
    })
  })

  describe('Edge cases', () => {
    it('should handle component without computed properties', () => {
      const code = `
        <script setup>
        import { ref } from 'vue'
        
        const count = ref(0)
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.computed).toBeUndefined()
    })

    it('should handle multiple computed properties with mixed configurations', () => {
      const code = `
        <script setup>
        import { ref, computed } from 'vue'
        
        const count = ref(0)
        const readonlyComputed = computed(() => count.value * 2)
        const writableComputed = computed({
          get: () => count.value,
          set: (value) => { count.value = value }
        })
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.computed).toBeDefined()
      const computedProps = result.compositionAPI?.computed || []

      expect(computedProps.length).toBe(2)

      const readonly = computedProps.find(c => c.name === 'readonlyComputed')
      const writable = computedProps.find(c => c.name === 'writableComputed')

      expect(readonly?.isReadonly).toBe(true)
      expect(writable?.isReadonly).toBe(false)
      expect(writable?.hasSetter).toBe(true)
    })

    it('should handle computed properties with complex expressions', () => {
      const code = `
        <script setup>
        import { ref, computed } from 'vue'
        
        const a = ref(1)
        const b = ref(2)
        const c = ref(3)
        
        const complexComputed = computed(() => {
          const sum = a.value + b.value
          return sum * c.value
        })
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.computed).toBeDefined()
      const computedProps = result.compositionAPI?.computed || []

      expect(
        computedProps.find(c => c.name === 'complexComputed')
      ).toBeDefined()
    })
  })
})
