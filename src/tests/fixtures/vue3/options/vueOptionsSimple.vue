<script lang="ts">
// Vue 3 Options API with simple export default {}
export default {
  name: 'Vue3SimpleOptions',
  props: {
    title: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      internalCount: this.count,
      message: 'Hello Vue 3'
    }
  },
  computed: {
    formattedTitle() {
      return `${this.title} - ${this.message}`
    },
    isOverLimit() {
      return this.internalCount > 10
    }
  },
  watch: {
    count(newVal) {
      this.internalCount = newVal
    }
  },
  methods: {
    increment() {
      this.internalCount++
    },
    decrement() {
      this.internalCount--
    },
    updateMessage(newMessage: string) {
      this.message = newMessage
    }
  },
  // Vue 3 lifecycle hooks
  onMounted() {
    console.log('Component mounted')
  },
  onUnmounted() {
    console.log('Component unmounted')
  },
  onUpdated() {
    console.log('Component updated')
  }
}
</script>

<template>
  <div>{{ formattedTitle }}</div>
</template>
