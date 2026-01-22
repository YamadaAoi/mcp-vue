<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Counter',
  props: {
    title: {
      type: String,
      required: true
    },
    initialCount: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      count: this.initialCount
    }
  },
  computed: {
    doubled(): number {
      return this.count * 2
    }
  },
  watch: {
    count(newVal: number, oldVal: number) {
      console.log(`Count changed from ${oldVal} to ${newVal}`)
    }
  },
  methods: {
    increment(): void {
      this.count++
    },
    decrement(): void {
      this.count--
    },
    greet(name: string): string {
      return `Hello, ${name}!`
    },
    add(a: number, b: number): number {
      return a + b
    },
    sum(numbers: number[]): number {
      return numbers.reduce((a, b) => a + b, 0)
    },
    greetDefault(name: string = 'World'): string {
      return `Hello, ${name}!`
    }
  },
  mounted() {
    console.log('Component mounted')
  },
  beforeUnmount() {
    console.log('Component will unmount')
  }
})
</script>

<template>
  <div class="counter">
    <h2>{{ title }}</h2>
    <p>Count: {{ count }}</p>
    <p>Doubled: {{ doubled }}</p>
    <button @click="increment">Increment</button>
    <button @click="decrement">Decrement</button>
  </div>
</template>
