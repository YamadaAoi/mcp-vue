// 复杂 TypeScript 代码示例

// 泛型类
class Repository<T> {
  private items: T[] = []

  add(item: T): void {
    this.items.push(item)
  }

  find(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate)
  }

  findAll(): T[] {
    return [...this.items]
  }

  remove(predicate: (item: T) => boolean): void {
    this.items = this.items.filter(item => !predicate(item))
  }

  clear(): void {
    this.items = []
  }

  size(): number {
    return this.items.length
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }

  map<U>(mapper: (item: T) => U): U[] {
    return this.items.map(mapper)
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.items.filter(predicate)
  }

  reduce<U>(reducer: (acc: U, item: T) => U, initial: U): U {
    return this.items.reduce(reducer, initial)
  }
}

// 装饰器
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value

  descriptor.value = function (...args: any[]) {
    console.log(`Calling ${propertyKey} with args:`, args)
    const result = originalMethod.apply(this, args)
    console.log(`${propertyKey} returned:`, result)
    return result
  }
}

function validate(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value

  descriptor.value = function (...args: any[]) {
    if (args.some(arg => arg === null || arg === undefined)) {
      throw new Error('Invalid arguments: null or undefined not allowed')
    }
    return originalMethod.apply(this, args)
  }
}

class Calculator {
  @log
  @validate
  add(a: number, b: number): number {
    return a + b
  }

  @log
  @validate
  subtract(a: number, b: number): number {
    return a - b
  }

  @log
  @validate
  multiply(a: number, b: number): number {
    return a * b
  }

  @log
  @validate
  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero')
    }
    return a / b
  }
}

// 枚举
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest'
}

enum StatusCode {
  OK = 200,
  NotFound = 404,
  ServerError = 500
}

// 命名空间
namespace Utils {
  export function formatDate(date: Date): string {
    return date.toISOString()
  }

  export function parseDate(dateString: string): Date {
    return new Date(dateString)
  }

  export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null

    return function (...args: Parameters<T>) {
      if (timeout) {
        clearTimeout(timeout)
      }

      timeout = setTimeout(() => {
        func.apply(this, args)
      }, wait)
    }
  }

  export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean

    return function (...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }
}

// 联合类型
type Result<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }
  | { status: 'pending' }

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// 条件类型
type NonNullable<T> = T extends null | undefined ? never : T

type Flatten<T> = T extends any[] ? T[number] : T

// 映射类型
type Partial<T> = {
  [P in keyof T]?: T[P]
}

type Required<T> = {
  [P in keyof T]-?: T[P]
}

type Readonly<T> = {
  readonly [P in keyof T]: T[P]
}

type Pick<T, K extends keyof T> = {
  [P in K]: T[P]
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

// 模板字面量类型
type EventName<T extends string> = `on${Capitalize<T>}`

type CSSProperties = {
  [K in keyof CSSStyleDeclaration as CSSStyleDeclaration[K] extends string
    ? K
    : never]: string
}

// 索引签名
type Dictionary<T> = {
  [key: string]: T
}

type NumericDictionary<T> = {
  [key: number]: T
}

// 接口
interface User {
  id: number
  name: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt?: Date
}

interface UserRepository {
  findById(id: number): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findAll(): Promise<User[]>
  create(user: Omit<User, 'id' | 'createdAt'>): Promise<User>
  update(id: number, user: Partial<User>): Promise<User>
  delete(id: number): Promise<void>
}

// 泛型接口
interface Response<T> {
  data: T
  status: number
  message: string
}

interface PaginatedResponse<T> extends Response<T[]> {
  page: number
  pageSize: number
  total: number
}

// 类型别名
type ID = string | number
type Timestamp = number
type Callback<T> = (error: Error | null, result?: T) => void

// 类型守卫
function isUser(obj: any): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string'
  )
}

function isResult<T>(obj: any): obj is Result<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.status === 'string' &&
    ['success', 'error', 'pending'].includes(obj.status)
  )
}

// 异步函数
async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  const data = await response.json()
  return data
}

async function fetchUsers(): Promise<User[]> {
  const response = await fetch('/api/users')
  const data = await response.json()
  return data
}

// 迭代器
function* generateFibonacci(): Generator<number> {
  let [prev, curr] = [0, 1]

  while (true) {
    yield curr
    ;[prev, curr] = [curr, prev + curr]
  }
}

function* generatePrimes(): Generator<number> {
  const primes: number[] = []
  let num = 2

  while (true) {
    if (primes.every(p => num % p !== 0)) {
      primes.push(num)
      yield num
    }
    num++
  }
}

// 混合类型
interface Counter {
  (start: number): string
  interval: number
  reset(): void
}

function getCounter(): Counter {
  const counter = function (start: number) {
    counter.interval = start
    return `Started at ${start}`
  } as Counter

  counter.interval = 0
  counter.reset = function () {
    counter.interval = 0
  }

  return counter
}

// 默认导出
export default {
  Calculator,
  Repository,
  UserRole,
  StatusCode,
  Utils
}

// 具名导出
export { User, UserRepository, User as IUser }
export type {
  Response,
  PaginatedResponse,
  Result,
  HttpMethod,
  ID,
  Timestamp,
  Callback
}
