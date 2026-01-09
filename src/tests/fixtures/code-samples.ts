export const simpleFunction = `
function greet(name: string): string {
  return \`Hello, \${name}!\`
}
`

export const arrowFunction = `
const add = (a: number, b: number): number => {
  return a + b
}
`

export const asyncFunction = `
async function fetchData(url: string): Promise<any> {
  const response = await fetch(url)
  return response.json()
}
`

export const classDefinition = `
class Person {
  private name: string
  protected age: number
  public email: string

  constructor(name: string, age: number, email: string) {
    this.name = name
    this.age = age
    this.email = email
  }

  public greet(): string {
    return \`Hello, I'm \${this.name}\`
  }

  private getAge(): number {
    return this.age
  }
}
`

export const interfaceDefinition = `
interface User {
  id: number
  name: string
  email?: string
  readonly createdAt: Date
}

interface Admin extends User {
  permissions: string[]
}
`

export const typeAlias = `
type Status = 'active' | 'inactive' | 'pending'

type ApiResponse<T> = {
  data: T
  status: Status
  message?: string
}
`

export const enumDefinition = `
enum Color {
  Red = '#FF0000',
  Green = '#00FF00',
  Blue = '#0000FF'
}
`

export const importExport = `
import { ref, computed } from 'vue'
import type { Ref } from 'vue'

export const useCounter = () => {
  const count: Ref<number> = ref(0)
  const doubled = computed(() => count.value * 2)

  return { count, doubled }
}

export default useCounter
`

export const variableDeclarations = `
const PI = 3.14159
let counter = 0
var legacyVar = 'old style'

const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000
}
`

export const vueComponent = `
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
`

export const vueOptionsAPI = `
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
      console.log(\`Count changed from \${oldVal} to \${newVal}\`)
    }
  },
  methods: {
    increment(): void {
      this.count++
    },
    decrement(): void {
      this.count--
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
`

export const complexTypeScript = `
interface Repository<T> {
  findById(id: number): Promise<T | null>
  findAll(): Promise<T[]>
  create(entity: Omit<T, 'id'>): Promise<T>
  update(id: number, entity: Partial<T>): Promise<T>
  delete(id: number): Promise<boolean>
}

abstract class BaseService<T extends { id: number }> {
  constructor(protected repository: Repository<T>) {}

  async get(id: number): Promise<T> {
    const entity = await this.repository.findById(id)
    if (!entity) {
      throw new Error(\`Entity with id \${id} not found\`)
    }
    return entity
  }

  async getAll(): Promise<T[]> {
    return this.repository.findAll()
  }

  abstract validate(entity: Partial<T>): boolean
}

class UserService extends BaseService<User> {
  validate(entity: Partial<User>): boolean {
    return !!entity.name && entity.name.length > 0
  }
}

type AsyncResult<T, E = Error> = Promise<[T, null] | [null, E]>

async function safeExecute<T>(
  fn: () => Promise<T>
): AsyncResult<T> {
  try {
    const result = await fn()
    return [result, null]
  } catch (error) {
    return [null, error as Error]
  }
}
`
