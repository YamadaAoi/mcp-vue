<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

const emit = defineEmits<{
  update: [value: number]
  delete: []
}>()

const localCount = ref(props.count)
const doubled = computed(() => localCount.value * 2)

onMounted(() => {
  console.log('Component mounted')
})

function increment() {
  localCount.value++
  emit('update', localCount.value)
}
</script>

<template>
  <div class="counter">
    <h2>{{ title }}</h2>
    <p>Count: {{ localCount }}</p>
    <p>Doubled: {{ doubled }}</p>
    <button @click="increment">Increment</button>
    <button v-if="localCount > 0" @click="emit('delete')">Reset</button>
  </div>
</template>

<style scoped>
.counter {
  padding: 16px;
  border: 1px solid #ccc;
}
</style>
