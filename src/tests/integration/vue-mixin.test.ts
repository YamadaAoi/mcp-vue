import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'

describe('MCP Code Parser - Vue Mixin Extraction (Options API)', () => {
  describe('Vue 2 Options API', () => {
    it('should extract basic mixin usage with identifiers', () => {
      const code = `
<script>
import MyMixin from './MyMixin'
import AnotherMixin from './AnotherMixin'

export default {
  name: 'TestComponent',
  mixins: [MyMixin, AnotherMixin],
  data() {
    return {
      message: 'Hello'
    }
  }
}
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.optionsAPI?.mixins).toBeDefined()
      expect(result.optionsAPI?.mixins?.length).toBe(2)
      expect(result.optionsAPI?.mixins?.[0]?.name).toBe('MyMixin')
      expect(result.optionsAPI?.mixins?.[1]?.name).toBe('AnotherMixin')
    })

    it('should extract mixins with string paths', () => {
      const code = `
<script>
export default {
  name: 'TestComponent',
  mixins: ['./MyMixin', './AnotherMixin'],
  data() {
    return {
      message: 'Hello'
    }
  }
}
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.optionsAPI?.mixins).toBeDefined()
      expect(result.optionsAPI?.mixins?.length).toBe(2)
      expect(result.optionsAPI?.mixins?.[0]?.name).toBe('./MyMixin')
      expect(result.optionsAPI?.mixins?.[0]?.source).toBe('./MyMixin')
      expect(result.optionsAPI?.mixins?.[1]?.name).toBe('./AnotherMixin')
      expect(result.optionsAPI?.mixins?.[1]?.source).toBe('./AnotherMixin')
    })

    it('should extract mixins with require calls', () => {
      const code = `
<script>
export default {
  name: 'TestComponent',
  mixins: [require('./MyMixin'), require('./AnotherMixin')],
  data() {
    return {
      message: 'Hello'
    }
  }
}
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.optionsAPI?.mixins).toBeDefined()
      expect(result.optionsAPI?.mixins?.length).toBe(2)
      expect(result.optionsAPI?.mixins?.[0]?.name).toBe('./MyMixin')
      expect(result.optionsAPI?.mixins?.[0]?.source).toBe('./MyMixin')
      expect(result.optionsAPI?.mixins?.[1]?.name).toBe('./AnotherMixin')
      expect(result.optionsAPI?.mixins?.[1]?.source).toBe('./AnotherMixin')
    })

    it('should handle empty mixins array', () => {
      const code = `
<script>
export default {
  name: 'TestComponent',
  mixins: [],
  data() {
    return {
      message: 'Hello'
    }
  }
}
</script>
`
      const result = parseVue(code, 'test.vue')
      // When mixins is an empty array, it should not be included in the result
      // This is consistent with how other empty properties are handled in the parser
      expect(result.optionsAPI?.mixins).toBeUndefined()
    })
  })

  describe('Vue 3 Options API', () => {
    it('should extract mixins from Vue 3 Options API component', () => {
      const code = `
<script>
import MyMixin from './MyMixin'

export default {
  name: 'TestComponent',
  mixins: [MyMixin],
  data() {
    return {
      message: 'Hello'
    }
  }
}
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.optionsAPI?.mixins).toBeDefined()
      expect(result.optionsAPI?.mixins?.length).toBe(1)
      expect(result.optionsAPI?.mixins?.[0]?.name).toBe('MyMixin')
    })
  })

  describe('Edge cases', () => {
    it('should not extract mixins from non-Options API components', () => {
      const code = `
<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.optionsAPI?.mixins || []).toHaveLength(0)
    })

    it('should handle components without mixins property', () => {
      const code = `
<script>
export default {
  name: 'TestComponent',
  data() {
    return {
      message: 'Hello'
    }
  }
}
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.optionsAPI?.mixins).toBeUndefined()
    })

    it('should handle mixins property with non-array value', () => {
      const code = `
<script>
export default {
  name: 'TestComponent',
  mixins: 'not-an-array',
  data() {
    return {
      message: 'Hello'
    }
  }
}
</script>
`
      const result = parseVue(code, 'test.vue')
      expect(result.optionsAPI?.mixins || []).toHaveLength(0)
    })
  })
})
