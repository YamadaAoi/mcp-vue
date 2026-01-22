<script setup lang="ts">
// Vue 3 Composition API with <script setup> syntax
import type { Ref, ComputedRef, PropType } from 'vue'
import {
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted,
  defineProps,
  defineEmits
} from 'vue'

// Define props with TypeScript
const props = defineProps<{
  initialCount: number
  title: string
  items?: string[]
}>()

// Define emits with TypeScript
const emit = defineEmits<{
  (e: 'update:count', count: number): void
  (e: 'item-added', item: string): void
}>()

// Refs with TypeScript types
const count = ref(props.initialCount)
const message = ref<string>('Hello from Vue 3 <script setup>')
const isLoading = ref<boolean>(false)
const user = ref<{
  name: string
  email: string
}>({
  name: 'Test User',
  email: 'test@example.com'
})

// Computed properties
const doubledCount = computed(() => count.value * 2)
const fullTitle = computed(() => `${props.title} - ${message.value}`)
const hasItems = computed(() => props.items?.length > 0)

// Watchers
watch(
  () => props.initialCount,
  newVal => {
    count.value = newVal
  }
)

watch(count, (newVal, oldVal) => {
  console.log(`Count changed from ${oldVal} to ${newVal}`)
  emit('update:count', newVal)
})

// Functions with TypeScript types
const increment = (): void => {
  count.value++
}

const decrement = (): void => {
  count.value--
}

const addItem = (item: string): void => {
  // Handle items array
  emit('item-added', item)
}

const fetchData = async (): Promise<void> => {
  isLoading.value = true
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    message.value = 'Data fetched successfully'
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    isLoading.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  console.log('Component mounted with setup script')
})

onUnmounted(() => {
  console.log('Component unmounted with setup script')
})

// Expose properties to template (all are automatically exposed in <script setup>)
// These are just examples of what you might use
const resetCount = (): void => {
  count.value = props.initialCount
}

// Methods with type annotations
function greet(name: string): string {
  return `Hello, ${name}!`
}

function add(a: number, b: number): number {
  return a + b
}

// Methods with complex types
interface User {
  id: number
  name: string
  email: string
}

function processUser(user: User): void {
  console.log(user.name)
}

function getUsers(): User[] {
  return []
}

// Methods with union types
function printValue(value: string | number): void {
  console.log(value)
}

// Methods with array types
function sum(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0)
}

function getFirst(items: string[]): string | undefined {
  return items[0]
}

// Methods with destructured parameters
function greetDestructured({
  name,
  age
}: {
  name: string
  age: number
}): string {
  return `Hello ${name}, you are ${age} years old`
}

function sumDestructured([a, b]: [number, number]): number {
  return a + b
}

// Methods with rest parameters
function sumAll(...numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0)
}

function greetRest(greeting: string, ...names: string[]): string {
  return `${greeting}, ${names.join(', ')}!`
}

// Methods with default parameters
function greetDefault(name: string = 'World'): string {
  return `Hello, ${name}!`
}

function addDefault(a: number, b: number = 0): number {
  return a + b
}

// Async methods
async function fetchUserData(url: string): Promise<any> {
  const response = await fetch(url)
  return response.json()
}

async function getUserData(id: number): Promise<{ id: number; name: string }> {
  return { id, name: 'John' }
}

// Arrow functions
const arrowAdd = (a: number, b: number): number => a + b
const arrowMultiply = (a: number, b: number): number => a * b

// Async arrow functions
const arrowFetchData = async (url: string): Promise<any> => {
  const response = await fetch(url)
  return response.json()
}
</script>

<template>
  <div class="vue3-setup-component">
    <h2>{{ fullTitle }}</h2>
    <p>Count: {{ count }} (Doubled: {{ doubledCount }})</p>
    <div v-if="hasItems">
      <h3>Items:</h3>
      <ul>
        <li v-for="item in items" :key="item">{{ item }}</li>
      </ul>
    </div>
    <div>
      <button @click="increment">Increment</button>
      <button @click="decrement">Decrement</button>
      <button @click="resetCount">Reset</button>
      <button @click="fetchData" :disabled="isLoading">
        {{ isLoading ? 'Loading...' : 'Fetch Data' }}
      </button>
    </div>
  </div>
</template>
