<script>
// Vue 2.7 Options API with export default {}
export default {
  name: 'Vue27DefaultOptions',
  // Vue 2 specific props validation
  props: {
    message: {
      type: String,
      default: 'Hello Vue 2.7',
      validator: function (value) {
        return typeof value === 'string'
      }
    },
    count: {
      type: Number,
      required: true
    },
    items: {
      type: Array,
      default: function () {
        return []
      }
    },
    config: {
      type: Object,
      default: function () {
        return { enabled: false }
      }
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
  // Vue 2 filters
  filters: {
    capitalize: function (value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    },
    truncate: function (value, limit) {
      if (value.length <= limit) return value
      return value.substring(0, limit) + '...'
    }
  },
  // Computed properties
  computed: {
    fullMessage() {
      return `${this.message} - Count: ${this.internalCount}`
    },
    isOverLimit() {
      return this.internalCount > 10
    },
    userInfo() {
      return `${this.user.name} (${this.user.age} years old)`
    }
  },
  // Watch properties (Vue 2 syntax)
  watch: {
    count: function (newVal, oldVal) {
      this.internalCount = newVal
    },
    message: {
      handler: function (newVal) {
        console.log('Message changed:', newVal)
      },
      immediate: true
    },
    'user.name': function (newName) {
      console.log('User name changed:', newName)
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
    updateUser(name) {
      this.user.name = name
    },
    triggerEvent() {
      // Vue 2 specific event system
      this.$emit('custom-event', { data: 'test' })
    },
    // Vue 2 specific $on, $off for event handling
    setupEvents() {
      this.$on('child-event', this.handleChildEvent)
    },
    teardownEvents() {
      this.$off('child-event', this.handleChildEvent)
    },
    handleChildEvent(payload) {
      console.log('Child event received:', payload)
    },
    // Vue 2 specific $listeners
    passListeners() {
      return this.$listeners
    },
    // Vue 2 specific $attrs
    passAttrs() {
      return this.$attrs
    }
  },
  // Vue 2 lifecycle hooks
  beforeCreate() {
    console.log('Before create')
  },
  created() {
    console.log('Created')
    this.setupEvents()
  },
  beforeMount() {
    console.log('Before mount')
  },
  mounted() {
    console.log('Mounted')
  },
  beforeUpdate() {
    console.log('Before update')
  },
  updated() {
    console.log('Updated')
  },
  beforeDestroy() {
    console.log('Before destroy')
    this.teardownEvents()
  },
  destroyed() {
    console.log('Destroyed')
  },
  // Vue 2 specific lifecycle hooks
  activated() {
    console.log('Activated')
  },
  deactivated() {
    console.log('Deactivated')
  },
  errorCaptured(err, vm, info) {
    console.error('Error captured:', err)
    return false
  }
}
</script>

<template>
  <div>{{ fullMessage }}</div>
</template>
