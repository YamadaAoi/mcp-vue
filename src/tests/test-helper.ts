import { spawn, ChildProcess } from 'child_process'

export class MCPServerTestClient {
  #server: ChildProcess
  #requestId = 1
  #pendingRequests = new Map<
    number,
    {
      resolve: (value: unknown) => void
      reject: (error: Error) => void
    }
  >()

  constructor() {
    this.#server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'inherit']
    })

    this.#server.stdout?.on('data', (data: Buffer) => {
      const lines = data
        .toString()
        .split('\n')
        .filter(line => line.trim())

      for (const line of lines) {
        try {
          const response = JSON.parse(line)
          const pending = this.#pendingRequests.get(response.id as number)
          if (pending) {
            this.#pendingRequests.delete(response.id as number)
            pending.resolve(response)
          }
        } catch (error) {
          console.error('Error parsing response:', error)
        }
      }
    })
  }

  async sendRequest(
    method: string,
    params?: Record<string, unknown>
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = this.#requestId++
      const request = {
        jsonrpc: '2.0',
        method,
        params,
        id
      }

      this.#server.stdin?.write(JSON.stringify(request) + '\n')

      const timeout = setTimeout(() => {
        this.#pendingRequests.delete(id)
        reject(new Error(`Request ${id} timeout`))
      }, 30000)

      this.#pendingRequests.set(id, {
        resolve: (response: unknown) => {
          clearTimeout(timeout)
          resolve(response)
        },
        reject: (error: Error) => {
          clearTimeout(timeout)
          reject(error)
        }
      })
    })
  }

  async initialize(): Promise<void> {
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    })

    await this.sendRequest('initialized')
  }

  async shutdown(): Promise<void> {
    await this.sendRequest('shutdown')
  }

  async close(): Promise<void> {
    this.#server.kill()
  }
}

export const testCode = `
interface User {
  id: number
  name: string
  email: string
}

class UserService {
  private users: User[] = []

  async getUserById(id: number): Promise<User | null> {
    return this.users.find(u => u.id === id) || null
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const newUser = { id: this.users.length + 1, ...user }
    this.users.push(newUser)
    return newUser
  }
}

const userService = new UserService()

export { UserService, userService }
`

export const vueCode = `
<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="increment">Count: {{ count }}</button>
    <UserCard :user="currentUser" @update="handleUpdate" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import UserCard from './UserCard.vue'

interface Props {
  initialTitle: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  change: [value: string]
}>()

const count = ref(0)
const title = computed(() => props.initialTitle)

function increment() {
  count.value++
  emit('change', count.value.toString())
}

const currentUser = ref({
  id: 1,
  name: 'Test User'
})

function handleUpdate(data: unknown) {
  console.log('Updated:', data)
}
</script>
`
