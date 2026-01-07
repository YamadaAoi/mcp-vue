// 边界情况测试代码

// 递归类型
type TreeNode<T> = {
  value: T
  left?: TreeNode<T>
  right?: TreeNode<T>
}

// 函数重载
function combine(a: string, b: string): string
function combine(a: number, b: number): number
function combine(a: any, b: any): any {
  return a + b
}

// 可选链和空值合并
const user = {
  name: 'Alice',
  address: {
    city: 'New York'
  }
}

const city = user?.address?.city ?? 'Unknown'

// 模板字面量类型
type EventName = `on${Capitalize<string>}`

const onClick: EventName = 'onClick'
const onSubmit: EventName = 'onSubmit'

// 条件类型
type NonNullable<T> = T extends null | undefined ? never : T

// 映射类型
type Partial<T> = {
  [P in keyof T]?: T[P]
}

// 索引签名
type StringMap = {
  [key: string]: string
}

// 装饰器（实验性）
function sealed(constructor: Function) {
  Object.seal(constructor)
  Object.seal(constructor.prototype)
}

@sealed
class Greeter {
  greeting: string

  constructor(message: string) {
    this.greeting = message
  }

  greet() {
    return 'Hello, ' + this.greeting
  }
}

// 泛型约束
interface Lengthwise {
  length: number
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length)
  return arg
}

// 类型推断
const arr = [1, 2, 3]
const first = arr[0]

// 类型断言
const value = 'hello' as string
const length = (value as string).length

// 类型守卫
function isString(value: any): value is string {
  return typeof value === 'string'
}

// 联合类型
type Result = 'success' | 'error' | 'pending'

// 交叉类型
type Person = {
  name: string
}

type Employee = {
  id: number
}

type PersonEmployee = Person & Employee

// 元组类型
type Point = [number, number]

const point: Point = [10, 20]

// 枚举
enum Color {
  Red,
  Green,
  Blue
}

// 命名空间
namespace Utils {
  export function add(a: number, b: number): number {
    return a + b
  }

  export function multiply(a: number, b: number): number {
    return a * b
  }
}

// 类型别名
type ID = string | number

// 可选参数
function greet(name: string, greeting?: string): string {
  return greeting ? `${greeting}, ${name}` : `Hello, ${name}`
}

// 剩余参数
function sum(...numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0)
}

// 解构赋值
const { name } = user
const [x, y] = point

// 展开运算符
const newUser = { ...user, age: 30 }
const newArr = [...arr, 4, 5]

// 异步函数
async function fetchData(): Promise<string> {
  return 'data'
}

// 迭代器
function* generateSequence(): Generator<number> {
  yield 1
  yield 2
  yield 3
}

// 类型谓词
function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

// keyof 操作符
type UserKeys = keyof typeof user

// typeof 操作符
type User = typeof user

// infer 类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any

// 条件类型中的 infer
type Unpacked<T> = T extends (infer U)[] ? U : T
