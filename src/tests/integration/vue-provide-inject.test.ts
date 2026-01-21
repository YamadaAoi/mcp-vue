import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'

describe('MCP Code Parser - Vue Provide/Inject Extraction (Composition API)', () => {
  describe('Vue 3 Composition API', () => {
    it('should extract basic provide call', () => {
      const code = `
<script setup>
import { provide, ref } from 'vue'

const message = ref('Hello')

provide('message', message)
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.provide).toBeDefined()
      const provideItem = result.compositionAPI?.provide?.[0]
      expect(provideItem).toBeDefined()
      expect(provideItem?.key).toBe('message')
    })

    it('should extract provide with string key and primitive value', () => {
      const code = `
<script setup>
import { provide } from 'vue'

provide('apiKey', '123456')
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.provide).toBeDefined()
      const provideItem = result.compositionAPI?.provide?.[0]
      expect(provideItem).toBeDefined()
      expect(provideItem?.key).toBe('apiKey')
    })

    it('should extract provide with Symbol key', () => {
      const code = `
<script setup>
import { provide } from 'vue'

provide(Symbol('user'), { name: 'John' })
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.provide).toBeDefined()
      const provideItem = result.compositionAPI?.provide?.[0]
      expect(provideItem).toBeDefined()
      expect(provideItem?.key).toBe('user')
      expect(provideItem?.isSymbolKey).toBe(true)
    })

    it('should extract basic inject call', () => {
      const code = `
<script setup>
import { inject } from 'vue'

const message = inject('message')
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.inject).toBeDefined()
      const injectItem = result.compositionAPI?.inject?.[0]
      expect(injectItem).toBeDefined()
      expect(injectItem?.key).toBe('message')
      expect(injectItem?.alias).toBe('message')
    })

    it('should extract inject with default value', () => {
      const code = `
<script setup>
import { inject } from 'vue'

const message = inject('message', 'Default message')
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.inject).toBeDefined()
      const injectItem = result.compositionAPI?.inject?.[0]
      expect(injectItem).toBeDefined()
      expect(injectItem?.key).toBe('message')
      expect(injectItem?.alias).toBe('message')
    })

    it('should extract inject with Symbol key', () => {
      const code = `
<script setup>
import { inject } from 'vue'

const user = inject(Symbol('user'))
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.inject).toBeDefined()
      const injectItem = result.compositionAPI?.inject?.[0]
      expect(injectItem).toBeDefined()
      expect(injectItem?.key).toBe('user')
      expect(injectItem?.alias).toBe('user')
      expect(injectItem?.isSymbolKey).toBe(true)
    })

    it('should extract inject with alias', () => {
      const code = `
<script setup>
import { inject } from 'vue'

const myMessage = inject('message')
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.inject).toBeDefined()
      const injectItem = result.compositionAPI?.inject?.[0]
      expect(injectItem).toBeDefined()
      expect(injectItem?.key).toBe('message')
      expect(injectItem?.alias).toBe('myMessage')
    })

    it('should handle multiple provide and inject calls', () => {
      const code = `
<script setup>
import { provide, inject } from 'vue'

provide('message', 'Hello')
provide('count', 42)

const message = inject('message')
const count = inject('count')
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.provide).toBeDefined()
      expect(result.compositionAPI?.provide?.length).toBe(2)
      expect(result.compositionAPI?.inject).toBeDefined()
      expect(result.compositionAPI?.inject?.length).toBe(2)
    })
  })

  describe('Vue 2 Composition API', () => {
    it('should extract provide and inject from Vue 2 Composition API component', () => {
      const code = `
<script>
import { provide, inject, ref } from '@vue/composition-api'

export default {
  setup() {
    const message = ref('Hello')
    
    provide('message', message)
    const injectedMessage = inject('message')

    return {
      message,
      injectedMessage
    }
  }
}
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.provide).toBeDefined()
      expect(result.compositionAPI?.provide?.length).toBe(1)
      expect(result.compositionAPI?.inject).toBeDefined()
      expect(result.compositionAPI?.inject?.length).toBe(1)
    })
  })

  describe('Edge cases', () => {
    it('should handle provide with reactive value', () => {
      const code = `
<script setup>
import { provide, reactive } from 'vue'

const state = reactive({ count: 0 })
provide('state', state)
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.provide).toBeDefined()
      const provideItem = result.compositionAPI?.provide?.[0]
      expect(provideItem).toBeDefined()
      expect(provideItem?.key).toBe('state')
    })

    it('should handle inject with complex default value', () => {
      const code = `
<script setup>
import { inject } from 'vue'

const config = inject('config', { apiUrl: '/api', timeout: 5000 })
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.inject).toBeDefined()
      const injectItem = result.compositionAPI?.inject?.[0]
      expect(injectItem).toBeDefined()
      expect(injectItem?.key).toBe('config')
      expect(injectItem?.alias).toBe('config')
    })

    it('should not extract non-provide/inject calls', () => {
      const code = `
<script setup>
import { ref } from 'vue'

const count = ref(0)

// This is not a provide or inject call
function someFunction() {
  console.log('Count:', count.value)
}
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.provide || []).toHaveLength(0)
      expect(result.compositionAPI?.inject || []).toHaveLength(0)
    })
  })
})
