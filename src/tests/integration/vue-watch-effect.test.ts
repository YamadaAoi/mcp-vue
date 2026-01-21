import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'

describe('MCP Code Parser - Vue WatchEffect Extraction (Composition API)', () => {
  describe('Vue 3 Composition API', () => {
    it('should extract basic watchEffect', () => {
      const code = `
<script setup>
import { ref, watchEffect } from 'vue'

const count = ref(0)

watchEffect(() => {
  console.log('Count:', count.value)
})
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.watchEffects).toBeDefined()
      const watchEffectItem = result.compositionAPI?.watchEffects?.[0]
      expect(watchEffectItem).toBeDefined()
      expect(watchEffectItem?.name).toBe('watchEffect')
      expect(watchEffectItem?.parameters).toEqual([])
    })

    it('should extract watchEffect with variable declaration', () => {
      const code = `
<script setup>
import { ref, watchEffect } from 'vue'

const count = ref(0)

const stop = watchEffect(() => {
  console.log('Count:', count.value)
})
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.watchEffects).toBeDefined()
      const watchEffectItem = result.compositionAPI?.watchEffects?.[0]
      expect(watchEffectItem).toBeDefined()
      expect(watchEffectItem?.name).toBe('stop')
      expect(watchEffectItem?.parameters).toEqual([])
    })

    it('should extract watchEffect with options object', () => {
      const code = `
<script setup>
import { ref, watchEffect } from 'vue'

const count = ref(0)

watchEffect(() => {
  console.log('Count:', count.value)
}, {
  flush: 'post',
  onTrack: (e) => console.log('Tracked:', e),
  onTrigger: (e) => console.log('Triggered:', e)
})
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.watchEffects).toBeDefined()
      const watchEffectItem = result.compositionAPI?.watchEffects?.[0]
      expect(watchEffectItem).toBeDefined()
      expect(watchEffectItem?.name).toBe('watchEffect')
      expect(watchEffectItem?.flush).toBe('post')
      expect(watchEffectItem?.onTrack).toBe(true)
      expect(watchEffectItem?.onTrigger).toBe(true)
    })

    it('should extract watchEffect with callback parameters', () => {
      const code = `
<script setup>
import { ref, watchEffect } from 'vue'

const count = ref(0)

watchEffect((onCleanup) => {
  console.log('Count:', count.value)
  
  onCleanup(() => {
    console.log('Cleanup')
  })
})
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.watchEffects).toBeDefined()
      const watchEffectItem = result.compositionAPI?.watchEffects?.[0]
      expect(watchEffectItem).toBeDefined()
      expect(watchEffectItem?.name).toBe('watchEffect')
      expect(watchEffectItem?.parameters).toEqual(['onCleanup'])
    })
  })

  describe('Vue 2 Composition API', () => {
    it('should extract watchEffect from Vue 2 Composition API component', () => {
      const code = `
<script>
import { ref, watchEffect } from '@vue/composition-api'

export default {
  setup() {
    const count = ref(0)

    watchEffect(() => {
      console.log('Count:', count.value)
    })

    return {
      count
    }
  }
}
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.watchEffects).toBeDefined()
      const watchEffectItem = result.compositionAPI?.watchEffects?.[0]
      expect(watchEffectItem).toBeDefined()
      expect(watchEffectItem?.name).toBe('watchEffect')
      expect(watchEffectItem?.parameters).toEqual([])
    })

    it('should extract watchEffect with variable declaration from Vue 2 Composition API component', () => {
      const code = `
<script>
import { ref, watchEffect } from '@vue/composition-api'

export default {
  setup() {
    const count = ref(0)

    const stop = watchEffect(() => {
      console.log('Count:', count.value)
    })

    return {
      count,
      stop
    }
  }
}
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.watchEffects).toBeDefined()
      const watchEffectItem = result.compositionAPI?.watchEffects?.[0]
      expect(watchEffectItem).toBeDefined()
      expect(watchEffectItem?.name).toBe('stop')
      expect(watchEffectItem?.parameters).toEqual([])
    })
  })

  describe('Edge cases', () => {
    it('should handle multiple watchEffect calls', () => {
      const code = `
<script setup>
import { ref, watchEffect } from 'vue'

const count = ref(0)
const message = ref('Hello')

watchEffect(() => {
  console.log('Count:', count.value)
})

watchEffect(() => {
  console.log('Message:', message.value)
})
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.watchEffects).toBeDefined()
      expect(result.compositionAPI?.watchEffects?.length).toBe(2)
    })

    it('should handle watchEffect with empty callback', () => {
      const code = `
<script setup>
import { watchEffect } from 'vue'

watchEffect(() => {})
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.watchEffects).toBeDefined()
      const watchEffectItem = result.compositionAPI?.watchEffects?.[0]
      expect(watchEffectItem).toBeDefined()
      expect(watchEffectItem?.name).toBe('watchEffect')
    })

    it('should not extract non-watchEffect calls', () => {
      const code = `
<script setup>
import { ref, watchEffect } from 'vue'

const count = ref(0)

// This is not a watchEffect call
function someFunction() {
  console.log('Count:', count.value)
}
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.compositionAPI?.watchEffects || []).toHaveLength(0)
    })
  })
})
