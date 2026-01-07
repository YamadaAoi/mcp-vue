<template>
  <div class="counter">
    <h1>Count: {{ count }}</h1>
    <button @click="increment">Increment</button>
    <button @click="decrement">Decrement</button>
    <button @click="reset">Reset</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
  initialCount?: number
  maxCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialCount: 0,
  maxCount: 100
})

const count = ref(props.initialCount)

const isMaxReached = computed(() => count.value >= props.maxCount)

function increment() {
  if (count.value < props.maxCount) {
    count.value++
  }
}

function decrement() {
  if (count.value > 0) {
    count.value--
  }
}

function reset() {
  count.value = props.initialCount
}

defineExpose({
  increment,
  decrement,
  reset
})
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
