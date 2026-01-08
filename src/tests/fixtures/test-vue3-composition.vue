<template>
  <div>
    <h1>Vue3 Composition API Test</h1>
    <p>Message: {{ message }}</p>
    <p>Computed: {{ computedMessage }}</p>
    <button @click="handleClick">Click me</button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const message = ref('Hello Vue3')
const count = ref(0)
const numbers = ref([1, 2, 3, 4, 5])

const computedMessage = computed(() => {
  return message.value.toUpperCase()
})

watch(message, (newVal, oldVal) => {
  console.log(`Message changed from ${oldVal} to ${newVal}`)
})

function handleClick() {
  console.log('Button clicked')
  count.value++
  numbers.value.forEach(n => {
    console.log(n)
  })
  numbers.value.findIndex(src => src === 1)
}

onMounted(() => {
  console.log('Component mounted')
})

const doubledNumbers = numbers.value.map(n => n * 2)
const sum = numbers.value.reduce((acc, curr) => acc + curr, 0)
const filtered = numbers.value.filter(n => n > 2)
const found = numbers.value.find(n => n === 3)
</script>

<style scoped>
.composition-api {
  padding: 20px;
}
</style>
