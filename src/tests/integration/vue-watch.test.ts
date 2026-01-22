import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'

const logger = console

describe('MCP Code Parser - Vue Watch Extraction (Composition API)', () => {
  describe('Vue 3 Composition API', () => {
    it('should extract watch from Vue 3 Composition API component with setup script', () => {
      const code = `
        <script setup>
        import { ref, watch } from 'vue'
        
        const count = ref(0)
        const message = ref('Hello')
        
        watch(count, (newVal, oldVal) => {
          console.log('Count changed:', newVal, oldVal)
        })
        
        const stopWatch = watch(message, (newVal) => {
          console.log('Message changed:', newVal)
        })
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.watch).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.watch)).toBe(true)
      expect(result.compositionAPI?.watch?.length).toBe(2)

      const countWatch = result.compositionAPI?.watch?.find(
        w => w.name === 'watch'
      )
      expect(countWatch).toBeDefined()
      expect(countWatch?.dependencies).toEqual(['count'])
      expect(countWatch?.parameters).toEqual(['newVal', 'oldVal'])
      expect(countWatch?.isDeep).toBe(false)
      expect(countWatch?.isImmediate).toBe(false)
      expect(countWatch?.callbackType).toBe('function')

      const messageWatch = result.compositionAPI?.watch?.find(
        w => w.name === 'stopWatch'
      )
      expect(messageWatch).toBeDefined()
      expect(messageWatch?.dependencies).toEqual(['message'])
      expect(messageWatch?.parameters).toEqual(['newVal'])
    })

    it('should extract watch with array dependencies', () => {
      const code = `
        <script setup>
        import { ref, watch } from 'vue'
        
        const count = ref(0)
        const message = ref('Hello')
        
        watch([count, message], ([newCount, newMessage], [oldCount, oldMessage]) => {
          console.log('Count or message changed')
        })
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.watch).toBeDefined()
      const watchItem = result.compositionAPI?.watch?.[0]
      expect(watchItem).toBeDefined()
      expect(watchItem?.dependencies).toEqual(['count', 'message'])
      expect(watchItem?.isArrayWatch).toBe(true)
      expect(watchItem?.parameters).toEqual([
        '[newCount, newMessage]',
        '[oldCount, oldMessage]'
      ])
    })

    it('should extract watch with deep option', () => {
      const code = `
        <script setup>
        import { ref, watch } from 'vue'
        
        const user = ref({ name: 'John', age: 30 })
        
        watch(user, (newUser, oldUser) => {
          console.log('User changed:', newUser)
        }, { deep: true })
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.watch).toBeDefined()
      const watchItem = result.compositionAPI?.watch?.[0]
      expect(watchItem).toBeDefined()
      expect(watchItem?.dependencies).toEqual(['user'])
      expect(watchItem?.isDeep).toBe(true)
    })

    it('should extract watch with immediate option', () => {
      const code = `
        <script setup>
        import { ref, watch } from 'vue'
        
        const count = ref(0)
        
        watch(count, (newVal) => {
          console.log('Count:', newVal)
        }, { immediate: true })
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.watch).toBeDefined()
      const watchItem = result.compositionAPI?.watch?.[0]
      expect(watchItem).toBeDefined()
      expect(watchItem?.dependencies).toEqual(['count'])
      expect(watchItem?.isImmediate).toBe(true)
    })

    it('should extract watch with flush option', () => {
      const code = `
        <script setup>
        import { ref, watch } from 'vue'
        
        const count = ref(0)
        
        watch(count, (newVal) => {
          console.log('Count:', newVal)
        }, { flush: 'post' })
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.watch).toBeDefined()
      const watchItem = result.compositionAPI?.watch?.[0]
      expect(watchItem).toBeDefined()
      expect(watchItem?.dependencies).toEqual(['count'])
      expect(watchItem?.flush).toBe('post')
    })

    it('should extract watch with member expression dependency', () => {
      const code = `
        <script setup>
        import { ref, watch } from 'vue'
        
        const user = ref({ name: 'John', age: 30 })
        
        watch(user.value.name, (newName) => {
          console.log('Name changed:', newName)
        })
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.watch).toBeDefined()
      const watchItem = result.compositionAPI?.watch?.[0]
      expect(watchItem).toBeDefined()
      expect(watchItem?.dependencies).toEqual(['user.value.name'])
    })
  })

  describe('Vue 2 Composition API', () => {
    it('should extract watch from Vue 2 Composition API component', () => {
      const code = `
        <script>
        import { ref, watch } from '@vue/composition-api'
        
        export default {
          setup() {
            const count = ref(0)
            
            watch(count, (newVal, oldVal) => {
              console.log('Count changed:', newVal, oldVal)
            })
            
            return {
              count
            }
          }
        }
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.watch).toBeDefined()
      expect(Array.isArray(result.compositionAPI?.watch)).toBe(true)
      expect(result.compositionAPI?.watch?.length).toBe(1)

      const watchItem = result.compositionAPI?.watch?.[0]
      expect(watchItem).toBeDefined()
      expect(watchItem?.dependencies).toEqual(['count'])
    })
  })

  describe('Edge cases', () => {
    it('should handle component without watch', () => {
      const code = `
        <script setup>
        import { ref } from 'vue'
        
        const count = ref(0)
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.watch).toBeUndefined()
    })

    it('should handle multiple watch with different configurations', () => {
      const code = `
        <script setup>
        import { ref, watch } from 'vue'
        
        const count = ref(0)
        const user = ref({ name: 'John', age: 30 })
        const items = ref([1, 2, 3])
        
        // Basic watch
        watch(count, (newVal) => {
          console.log('Count:', newVal)
        })
        
        // Watch with deep option
        watch(user, (newUser) => {
          console.log('User:', newUser)
        }, { deep: true })
        
        // Watch with array dependencies
        watch([count, items], ([newCount, newItems]) => {
          console.log('Count or items changed')
        })
        </script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.watch).toBeDefined()
      expect(result.compositionAPI?.watch?.length).toBe(3)
    })
  })
})
