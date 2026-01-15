import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'

describe('MCP Code Parser - Vue Emits Extraction', () => {
  describe('Vue 3 Composition API - defineEmits', () => {
    it('should extract emits from defineEmits with array syntax', () => {
      const code = `
<script setup lang="ts">
import { defineEmits } from 'vue'

const emit = defineEmits(['update', 'submit', 'cancel'])
</script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.emits).toBeDefined()
      expect(result.compositionAPI?.emits).toHaveLength(3)

      const emitNames = result.compositionAPI?.emits?.map(e => e.name)
      expect(emitNames).toContain('update')
      expect(emitNames).toContain('submit')
      expect(emitNames).toContain('cancel')
    })

    it('should extract emits from defineEmits with object syntax', () => {
      const code = `
<script setup lang="ts">
import { defineEmits } from 'vue'

const emit = defineEmits({
  update: null,
  submit: (payload: any) => boolean,
  cancel: null
})
</script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.emits).toBeDefined()
      expect(result.compositionAPI?.emits).toHaveLength(3)

      const emitNames = result.compositionAPI?.emits?.map(e => e.name)
      expect(emitNames).toContain('update')
      expect(emitNames).toContain('submit')
      expect(emitNames).toContain('cancel')
    })

    it('should extract emits from defineEmits with TypeScript type syntax', () => {
      const code = `
<script setup lang="ts">
import { defineEmits } from 'vue'

const emit = defineEmits<{
  (e: 'update', value: number): void
  (e: 'submit', payload: any): void
  (e: 'cancel'): void
}>()
</script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.emits).toBeDefined()
      expect(result.compositionAPI?.emits).toHaveLength(3)

      const emitNames = result.compositionAPI?.emits?.map(e => e.name)
      expect(emitNames).toContain('update')
      expect(emitNames).toContain('submit')
      expect(emitNames).toContain('cancel')
    })
  })

  describe('Vue 3 Options API - emits property', () => {
    it('should extract emits from Vue 3 Options API with array syntax', () => {
      const code = `
<script>
import { defineComponent } from 'vue'

export default defineComponent({
  emits: ['update', 'submit', 'cancel'],
  methods: {
    handleSubmit() {
      this.$emit('submit')
    }
  }
})
</script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.optionsAPI?.emits).toBeDefined()
      expect(result.optionsAPI?.emits).toHaveLength(3)

      const emitNames = result.optionsAPI?.emits?.map(e => e.name)
      expect(emitNames).toContain('update')
      expect(emitNames).toContain('submit')
      expect(emitNames).toContain('cancel')
    })

    it('should extract emits from Vue 3 Options API with object syntax', () => {
      const code = `
<script>
import { defineComponent } from 'vue'

export default defineComponent({
  emits: {
    update: null,
    submit: null,
    cancel: null
  },
  methods: {
    handleSubmit() {
      this.$emit('submit')
    }
  }
})
</script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.optionsAPI?.emits).toBeDefined()
      expect(result.optionsAPI?.emits).toHaveLength(3)

      const emitNames = result.optionsAPI?.emits?.map(e => e.name)
      expect(emitNames).toContain('update')
      expect(emitNames).toContain('submit')
      expect(emitNames).toContain('cancel')
    })

    it('should extract emits from Vue 3 Options API with string literal keys', () => {
      const code = `
<script>
import { defineComponent } from 'vue'

export default defineComponent({
  emits: {
    'update:modelValue': null,
    'submit-form': null
  }
})
</script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.optionsAPI?.emits).toBeDefined()
      expect(result.optionsAPI?.emits).toHaveLength(2)

      const emitNames = result.optionsAPI?.emits?.map(e => e.name)
      expect(emitNames).toContain('update:modelValue')
      expect(emitNames).toContain('submit-form')
    })
  })

  describe('Vue 2 Options API - emits property', () => {
    it('should extract emits from Vue 2 Options API with array syntax', () => {
      const code = `
<script>
export default {
  emits: ['update', 'submit', 'cancel'],
  methods: {
    handleSubmit() {
      this.$emit('submit')
    }
  }
}
</script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.optionsAPI?.emits).toBeDefined()
      expect(result.optionsAPI?.emits).toHaveLength(3)

      const emitNames = result.optionsAPI?.emits?.map(e => e.name)
      expect(emitNames).toContain('update')
      expect(emitNames).toContain('submit')
      expect(emitNames).toContain('cancel')
    })

    it('should extract emits from Vue 2 Options API with object syntax', () => {
      const code = `
<script>
export default {
  emits: {
    update: null,
    submit: null,
    cancel: null
  },
  methods: {
    handleSubmit() {
      this.$emit('submit')
    }
  }
}
</script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.optionsAPI?.emits).toBeDefined()
      expect(result.optionsAPI?.emits).toHaveLength(3)

      const emitNames = result.optionsAPI?.emits?.map(e => e.name)
      expect(emitNames).toContain('update')
      expect(emitNames).toContain('submit')
      expect(emitNames).toContain('cancel')
    })

    it('should extract emits from Vue 2 Options API with string literal keys', () => {
      const code = `
<script>
export default {
  emits: {
    'update:modelValue': null,
    'submit-form': null
  }
}
</script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.optionsAPI?.emits).toBeDefined()
      expect(result.optionsAPI?.emits).toHaveLength(2)

      const emitNames = result.optionsAPI?.emits?.map(e => e.name)
      expect(emitNames).toContain('update:modelValue')
      expect(emitNames).toContain('submit-form')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty emits array', () => {
      const code = `
<script setup lang="ts">
import { defineEmits } from 'vue'

const emit = defineEmits([])
</script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.emits).toBeUndefined()
    })

    it('should handle empty emits object', () => {
      const code = `
<script setup lang="ts">
import { defineEmits } from 'vue'

const emit = defineEmits({})
</script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.emits).toBeUndefined()
    })

    it('should handle component without emits', () => {
      const code = `
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>
      `
      const result = parseVue(code, 'test.vue')

      expect(result.compositionAPI?.emits).toBeUndefined()
    })
  })
})
