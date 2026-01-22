<script>
// Vue 2.7 Composition API (supported in Vue 2.7+)
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export default {
  name: 'Vue27Composition',
  props: {
    initialCount: {
      type: Number,
      default: 0
    },
    title: {
      type: String,
      default: 'Vue 2.7 Composition API'
    }
  },
  setup(props, { emit }) {
    // Refs
    const count = ref(props.initialCount)
    const message = ref('Hello from Vue 2.7 Composition API')
    const isActive = ref(false)

    // Computed properties
    const doubledCount = computed(() => count.value * 2)
    const fullTitle = computed(() => `${props.title}: ${message.value}`)

    // Watchers
    watch(
      () => props.initialCount,
      newVal => {
        count.value = newVal
      }
    )

    watch(count, (newVal, oldVal) => {
      console.log(`Count changed from ${oldVal} to ${newVal}`)
      if (newVal > 10) {
        emit('limit-exceeded', newVal)
      }
    })

    // Methods
    const increment = () => {
      count.value++
    }

    const decrement = () => {
      count.value--
    }

    const toggleActive = () => {
      isActive.value = !isActive.value
    }

    // Lifecycle hooks (Vue 3 style but working in Vue 2.7)
    onMounted(() => {
      console.log('Component mounted')
    })

    onUnmounted(() => {
      console.log('Component unmounted')
    })

    // Return reactive state and methods
    return {
      count,
      message,
      isActive,
      doubledCount,
      fullTitle,
      increment,
      decrement,
      toggleActive
    }
  }
}
</script>

<template>
  <div>{{ fullTitle }}</div>
  <p>Count: {{ count }}</p>
  <p>Doubled: {{ doubledCount }}</p>
  <button @click="increment">Increment</button>
  <button @click="decrement">Decrement</button>
  <button @click="toggleActive">Toggle Active</button>
</template>
