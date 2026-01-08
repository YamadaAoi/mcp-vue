<template>
  <div class="counter">
    <h1>Count: {{ count }}</h1>
    <h2>Doubled: {{ doubledCount }}</h2>
    <h3>Message: {{ message }}</h3>
    <button @click="increment">Increment</button>
    <button @click="decrement">Decrement</button>
    <button @click="reset">Reset</button>
    <button @click="updateMessage">Update Message</button>
  </div>
</template>

<script>
export default {
  name: 'Counter',

  props: {
    initialCount: {
      type: Number,
      default: 0
    },
    maxCount: {
      type: Number,
      default: 100
    }
  },

  data() {
    return {
      count: 0,
      message: 'Hello Vue3 Options API',
      items: [],
      userInfo: null,
      loading: false
    }
  },

  computed: {
    doubledCount() {
      return this.count * 2
    },

    isMaxReached() {
      return this.count >= this.maxCount
    },

    canIncrement() {
      return this.count < this.maxCount
    },

    formattedMessage() {
      return `${this.message} (Count: ${this.count})`
    }
  },

  watch: {
    count(newVal, oldVal) {
      console.log(`Count changed from ${oldVal} to ${newVal}`)
    },

    message(newVal) {
      console.log(`Message changed to: ${newVal}`)
    },

    'userInfo.name'(newName) {
      console.log(`User name changed to: ${newName}`)
    },

    items: {
      handler(newItems) {
        console.log(`Items changed:`, newItems)
      },
      deep: true,
      immediate: true
    }
  },

  created() {
    console.log('Component created')
    this.count = this.initialCount
  },

  mounted() {
    console.log('Component mounted')
  },

  beforeUpdate() {
    console.log('Component about to update')
  },

  updated() {
    console.log('Component updated')
  },

  beforeUnmount() {
    console.log('Component about to unmount')
  },

  unmounted() {
    console.log('Component unmounted')
  },

  methods: {
    increment() {
      if (this.count < this.maxCount) {
        this.count++
      }
    },

    decrement() {
      if (this.count > 0) {
        this.count--
      }
    },

    reset() {
      this.count = this.initialCount
    },

    updateMessage() {
      this.message = `Updated at ${new Date().toLocaleTimeString()}`
    },

    async fetchData() {
      this.loading = true
      try {
        const response = await fetch('/api/data')
        this.items = await response.json()
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        this.loading = false
      }
    },

    formatNumber(num) {
      return num.toLocaleString()
    },

    validateInput(value) {
      return typeof value === 'number' && value >= 0
    },

    processArray() {
      const doubled = this.items.map(item => item * 2)
      const sum = this.items.reduce((acc, curr) => acc + curr, 0)
      const filtered = this.items.filter(item => item > 0)
      const found = this.items.find(item => item === 10)
      return { doubled, sum, filtered, found }
    }
  }
}
</script>

<style scoped>
.counter {
  padding: 20px;
  text-align: center;
}

button {
  margin: 0 5px;
  padding: 10px 20px;
}
</style>
