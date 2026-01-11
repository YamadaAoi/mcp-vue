<script>
// Vue 2.7 Options API with export default defineComponent{}
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Vue27DefineComponentOptions',
  // Vue 2 specific props validation
  props: {
    message: {
      type: String,
      default: 'Hello Vue 2.7 defineComponent',
      validator: function (value) {
        return typeof value === 'string'
      }
    },
    count: {
      type: Number,
      required: true
    }
  },
  // Data with Vue 2 syntax
  data() {
    return {
      internalCount: this.count,
      text: '',
      isActive: false,
      user: {
        name: 'Test User',
        age: 25
      }
    }
  },
  // Computed properties
  computed: {
    fullMessage() {
      return `${this.message} - Count: ${this.internalCount}`
    },
    isOverLimit() {
      return this.internalCount > 10
    }
  },
  // Methods with Vue 2 specific features
  methods: {
    increment() {
      // Vue 2 specific $set for reactivity
      this.$set(this.user, 'age', this.user.age + 1)
      this.internalCount++
    },
    decrement() {
      this.internalCount--
    },
    // Vue 2 specific $emit
    triggerEvent() {
      this.$emit('custom-event', { data: 'test' })
    }
  },
  // Vue 2 lifecycle hooks
  beforeCreate() {
    console.log('Before create')
  },
  created() {
    console.log('Created')
  },
  beforeDestroy() {
    console.log('Before destroy')
  },
  destroyed() {
    console.log('Destroyed')
  }
})
</script>

<template>
  <div>{{ fullMessage }}</div>
</template>
