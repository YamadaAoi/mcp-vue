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
  #buffer = ''

  constructor() {
    this.#server = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'inherit']
    })

    this.#server.stdout?.on('data', (data: Buffer) => {
      this.#buffer += data.toString()
      const lines = this.#buffer.split('\n')
      this.#buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const response = JSON.parse(line)
          const pending = this.#pendingRequests.get(response.id as number)
          if (pending) {
            this.#pendingRequests.delete(response.id as number)
            if (response.error) {
              pending.reject(
                new Error(response.error.message || 'Unknown error')
              )
            } else {
              pending.resolve(response)
            }
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

export const complexTypeScriptCode = `
// 泛型类
class Repository<T> {
  private items: T[] = []

  add(item: T): void {
    this.items.push(item)
  }

  findById(id: number): T | undefined {
    return this.items.find((item: any) => item.id === id)
  }

  findAll(): T[] {
    return [...this.items]
  }
}

// 装饰器
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value
  descriptor.value = function (...args: any[]) {
    console.log(\`Calling \${propertyKey} with args:\`, args)
    const result = originalMethod.apply(this, args)
    console.log(\`Result:\`, result)
    return result
  }
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b
  }

  @log
  multiply(a: number, b: number): number {
    return a * b
  }
}

// 命名空间
namespace Utils {
  export function formatDate(date: Date): string {
    return date.toISOString()
  }

  export function parseDate(str: string): Date {
    return new Date(str)
  }
}

// 枚举
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest'
}

interface User {
  id: number
  name: string
  role: UserRole
}

// 类型别名
type ID = number | string
type UserMap = Map<ID, User>

// 联合类型
type Result<T, E = Error> = {
  success: true
  data: T
} | {
  success: false
  error: E
}

async function fetchUser(id: ID): Promise<Result<User>> {
  try {
    const user = { id: Number(id), name: 'John', role: UserRole.User }
    return { success: true, data: user }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

// 默认导出
export default Repository
export { Calculator, Utils, UserRole, User, UserMap, Result, fetchUser }
`

export const complexVueCode = `
<template>
  <div class="user-list">
    <h2>User List</h2>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div v-for="user in users" :key="user.id" class="user-card">
        <h3>{{ user.name }}</h3>
        <p>Email: {{ user.email }}</p>
        <p>Role: {{ user.role }}</p>
        <button @click="editUser(user)">Edit</button>
        <button @click="deleteUser(user.id)">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
}

const users = ref<User[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const adminCount = computed(() => users.value.filter(u => u.role === 'admin').length)

async function fetchUsers() {
  loading.value = true
  error.value = null
  try {
    const response = await fetch('/api/users')
    users.value = await response.json()
  } catch (err) {
    error.value = 'Failed to fetch users'
  } finally {
    loading.value = false
  }
}

function editUser(user: User) {
  console.log('Editing user:', user)
}

function deleteUser(id: number) {
  users.value = users.value.filter(u => u.id !== id)
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-list {
  padding: 20px;
}

.user-card {
  border: 1px solid #ccc;
  padding: 10px;
  margin: 10px 0;
}

.error {
  color: red;
}
</style>
`

export const edgeCaseCode = `
// 空文件
// 只包含注释

// 循环引用
interface A {
  b: B
}

interface B {
  a: A
}

// 递归类型
type TreeNode<T> = {
  value: T
  left?: TreeNode<T>
  right?: TreeNode<T>
}

// 复杂的泛型约束
interface WithLength {
  length: number
}

function getLength<T extends WithLength>(arg: T): number {
  return arg.length
}

// 条件类型
type NonNullable<T> = T extends null | undefined ? never : T

// 映射类型
type ReadonlyUser = {
  readonly [K in keyof User]: User[K]
}

// 索引签名
interface Dictionary {
  [key: string]: any
}

// 函数重载
function combine(a: string, b: string): string
function combine(a: number, b: number): number
function combine(a: any, b: any): any {
  return a + b
}

// 可选链和空值合并
const user = {
  profile: {
    name: 'John'
  }
}

const userName = user?.profile?.name ?? 'Unknown'

// 模板字面量类型
type EventName<T extends string> = \`on\${Capitalize<T>}\`

export { A, B, TreeNode, getLength, NonNullable, ReadonlyUser, Dictionary, combine, EventName }
`

export const invalidCode = `
// 语法错误的代码
function brokenFunction(
  const x = 10
  return x
}

// 类型错误
const num: number = 'string'

// 未声明的变量
console.log(undefinedVariable)

export { brokenFunction }
`

export const largeCode = `
// 大型代码示例
interface Config {
  apiUrl: string
  timeout: number
  retries: number
}

class HttpClient {
  constructor(private config: Config) {}

  async get<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.json()
  }

  async post<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  async put<T>(url: string, data: unknown): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  async delete<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      method: 'DELETE'
    })
    return response.json()
  }
}

class AuthService {
  constructor(private http: HttpClient) {}

  async login(username: string, password: string) {
    return this.http.post<{ token: string }>('/auth/login', { username, password })
  }

  async logout() {
    return this.http.post<void>('/auth/logout', {})
  }

  async refreshToken() {
    return this.http.post<{ token: string }>('/auth/refresh', {})
  }
}

class UserService {
  constructor(private http: HttpClient) {}

  async getUsers() {
    return this.http.get<User[]>('/users')
  }

  async getUser(id: number) {
    return this.http.get<User>(\`/users/\${id}\`)
  }

  async createUser(user: Omit<User, 'id'>) {
    return this.http.post<User>('/users', user)
  }

  async updateUser(id: number, user: Partial<User>) {
    return this.http.put<User>(\`/users/\${id}\`, user)
  }

  async deleteUser(id: number) {
    return this.http.delete<void>(\`/users/\${id}\`)
  }
}

class ProductService {
  constructor(private http: HttpClient) {}

  async getProducts() {
    return this.http.get<Product[]>('/products')
  }

  async getProduct(id: number) {
    return this.http.get<Product>(\`/products/\${id}\`)
  }

  async createProduct(product: Omit<Product, 'id'>) {
    return this.http.post<Product>('/products', product)
  }

  async updateProduct(id: number, product: Partial<Product>) {
    return this.http.put<Product>(\`/products/\${id}\`, product)
  }

  async deleteProduct(id: number) {
    return this.http.delete<void>(\`/products/\${id}\`)
  }
}

interface User {
  id: number
  name: string
  email: string
}

interface Product {
  id: number
  name: string
  price: number
}

export { HttpClient, AuthService, UserService, ProductService, Config, User, Product }
`
