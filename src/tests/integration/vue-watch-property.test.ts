import { describe, it, expect } from 'vitest'
import { parseVue } from '../../services/ast/vue/vueParser'

describe('Vue Watch Property Extraction', () => {
  it('should extract watch properties from Vue 2 Options API', () => {
    const code = `
<script>
export default {
  data() {
    return {
      count: 0,
      message: 'Hello'
    }
  },
  watch: {
    count(newVal, oldVal) {
      console.log('Count changed:', newVal, oldVal)
    },
    message: {
      handler(newVal, oldVal) {
        console.log('Message changed:', newVal, oldVal)
      },
      deep: true,
      immediate: true
    }
  }
}
</script>
`

    const result = parseVue(code, 'test.vue')

    expect(result.optionsAPI).toBeDefined()
    expect(result.optionsAPI?.watchProperties).toBeDefined()
    expect(result.optionsAPI?.watchProperties?.length).toBe(2)

    const countWatch = result.optionsAPI?.watchProperties?.find(
      w => w.name === 'count'
    )
    expect(countWatch).toBeDefined()
    expect(countWatch?.dependencies).toEqual(['count'])
    expect(countWatch?.parameters).toEqual(['newVal', 'oldVal'])
    expect(countWatch?.isDeep).toBeUndefined()
    expect(countWatch?.isImmediate).toBeUndefined()
    expect(countWatch?.callbackType).toBe('function')

    const messageWatch = result.optionsAPI?.watchProperties?.find(
      w => w.name === 'message'
    )
    expect(messageWatch).toBeDefined()
    expect(messageWatch?.dependencies).toEqual(['message'])
    expect(messageWatch?.parameters).toEqual(['newVal', 'oldVal'])
    expect(messageWatch?.isDeep).toBe(true)
    expect(messageWatch?.isImmediate).toBe(true)
    expect(messageWatch?.callbackType).toBe('object')
  })

  it('should extract watch properties from Vue 3 Options API', () => {
    const code = `
<script>
import { defineComponent } from 'vue'

export default defineComponent({
  data() {
    return {
      count: 0
    }
  },
  watch: {
    count(newVal) {
      console.log('Count changed:', newVal)
    }
  }
})
</script>
`

    const result = parseVue(code, 'test.vue')

    expect(result.optionsAPI).toBeDefined()
    expect(result.optionsAPI?.watchProperties).toBeDefined()
    expect(result.optionsAPI?.watchProperties?.length).toBe(1)

    const countWatch = result.optionsAPI?.watchProperties?.[0]
    expect(countWatch?.name).toBe('count')
    expect(countWatch?.dependencies).toEqual(['count'])
    expect(countWatch?.parameters).toEqual(['newVal'])
  })

  it('should extract watch properties with string literal keys', () => {
    const code = `
<script>
export default {
  data() {
    return {
      'user-name': 'John'
    }
  },
  watch: {
    'user-name'(newVal) {
      console.log('User name changed:', newVal)
    }
  }
}
</script>
`

    const result = parseVue(code, 'test.vue')

    expect(result.optionsAPI?.watchProperties?.length).toBe(1)
    expect(result.optionsAPI?.watchProperties?.[0].name).toBe('user-name')
  })

  it('should handle watch properties with arrow functions', () => {
    const code = `
<script>
export default {
  data() {
    return {
      count: 0
    }
  },
  watch: {
    count: (newVal, oldVal) => {
      console.log('Count changed:', newVal, oldVal)
    }
  }
}
</script>
`

    const result = parseVue(code, 'test.vue')

    expect(result.optionsAPI?.watchProperties?.length).toBe(1)
    expect(result.optionsAPI?.watchProperties?.[0].parameters).toEqual([
      'newVal',
      'oldVal'
    ])
  })

  it('should return empty array when no watch properties exist', () => {
    const code = `
<script>
export default {
  data() {
    return {
      count: 0
    }
  }
}
</script>
`

    const result = parseVue(code, 'test.vue')

    expect(result.optionsAPI?.watchProperties).toBeUndefined()
  })

  it('should not extract watch properties from Composition API', () => {
    const code = `
<script>
import { ref, watch } from 'vue'

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

    expect(result.compositionAPI).toBeDefined()
    expect(result.optionsAPI?.watchProperties).toBeUndefined()
  })
})
