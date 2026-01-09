function returnsString(): string {
  return 'hello'
}

function returnsNumber(): number {
  return 42
}

function returnsBoolean(): boolean {
  return true
}

function returnsVoid(): void {
  console.log('void')
}

function returnsNull(): null {
  return null
}

function returnsUndefined(): undefined {
  return undefined
}

function returnsObject(): { name: string; age: number } {
  return { name: 'Alice', age: 30 }
}

function returnsArray(): number[] {
  return [1, 2, 3]
}

function returnsGenericArray(): Array<string> {
  return ['a', 'b', 'c']
}

function returnsPromise(): Promise<string> {
  return Promise.resolve('hello')
}

function returnsPromiseNumber(): Promise<number> {
  return Promise.resolve(42)
}

function returnsPromiseObject(): Promise<{ id: number; name: string }> {
  return Promise.resolve({ id: 1, name: 'test' })
}

function returnsPromiseArray(): Promise<number[]> {
  return Promise.resolve([1, 2, 3])
}

async function asyncReturnsString(): Promise<string> {
  return 'hello'
}

async function asyncReturnsNumber(): Promise<number> {
  return 42
}

async function asyncReturnsObject(): Promise<{ id: number }> {
  return { id: 1 }
}

function returnsUnion(): string | number {
  return 'hello'
}

function returnsIntersection(): { name: string } & { age: number } {
  return { name: 'Alice', age: 30 }
}

function returnsFunction(): (x: number) => string {
  return x => x.toString()
}

function returnsTuple(): [string, number] {
  return ['hello', 42]
}

function returnsAny(): any {
  return 'anything'
}

function returnsUnknown(): unknown {
  return 'unknown'
}

function returnsNever(): never {
  throw new Error('never')
}

function returnsOptional(): { name?: string } {
  return {}
}

function returnsReadonly(): ReadonlyArray<number> {
  return [1, 2, 3]
}

function returnsGeneric<T>(value: T): T {
  return value
}

function returnsMultipleGenerics<K, V>(key: K, value: V): Map<K, V> {
  return new Map([[key, value]])
}

function returnsNestedGeneric(): Promise<{ data: Array<{ id: number }> }> {
  return Promise.resolve({ data: [{ id: 1 }] })
}

function returnsComplexUnion(): string | number | boolean | null {
  return 'hello'
}

function returnsComplexObject(): {
  id: number
  name: string
  tags: string[]
  metadata?: { created: Date }
} {
  return {
    id: 1,
    name: 'test',
    tags: ['a', 'b']
  }
}

function returnsArrayUnion(): (string | number)[] {
  return ['a', 1, 'b', 2]
}

function returnsPromiseUnion(): Promise<string | number> {
  return Promise.resolve('hello')
}

function returnsRecord(): Record<string, number> {
  return { a: 1, b: 2 }
}

function returnsPartial(): Partial<{ name: string; age: number }> {
  return { name: 'Alice' }
}

function returnsRequired(): Required<{ name?: string; age?: number }> {
  return { name: 'Alice', age: 30 }
}

function returnsPick(): Pick<
  { name: string; age: number; email: string },
  'name' | 'age'
> {
  return { name: 'Alice', age: 30 }
}

function returnsOmit(): Omit<
  { name: string; age: number; email: string },
  'email'
> {
  return { name: 'Alice', age: 30 }
}

function returnsReturnTypeOf(): ReturnType<typeof returnsString> {
  return 'hello'
}

function returnsParametersType(): Parameters<(x: number, y: string) => void> {
  return [1, 'hello']
}

function returnsConstructor(): new () => { method(): void } {
  return class {
    method() {}
  }
}

function returnsThis(): this {
  return this
}

function returnsInfer<T>(value: T): T extends (infer U)[] ? U : T {
  return Array.isArray(value) ? value[0] : value
}

function returnsConditional<T>(value: T): T extends string ? string : number {
  return typeof value === 'string' ? value : 42
}

function returnsAwaited<T>(value: Promise<T>): Awaited<T> {
  return value as any
}

function returnsUppercase(): Uppercase<'hello'> {
  return 'HELLO' as any
}

function returnsLowercase(): Lowercase<'HELLO'> {
  return 'hello' as any
}

function returnsCapitalize(): Capitalize<'hello'> {
  return 'Hello' as any
}

function returnsUncapitalize(): Uncapitalize<'Hello'> {
  return 'hello' as any
}

function returnsTemplateLiterals(): `prefix-${string}` {
  return 'prefix-test' as any
}

function returnsBigInt(): bigint {
  return 123n
}

function returnsSymbol(): symbol {
  return Symbol('test')
}

function returnsRegExp(): RegExp {
  return /test/g
}

function returnsDate(): Date {
  return new Date()
}

function returnsError(): Error {
  return new Error('test')
}

function returnsMap(): Map<string, number> {
  return new Map([['a', 1]])
}

function returnsSet(): Set<number> {
  return new Set([1, 2, 3])
}

function returnsWeakMap(): WeakMap<object, number> {
  return new WeakMap()
}

function returnsWeakSet(): WeakSet<object> {
  return new WeakSet()
}

function returnsIterator(): Iterator<number> {
  return [1, 2, 3][Symbol.iterator]()
}

function returnsIterable(): Iterable<number> {
  return [1, 2, 3]
}

function returnsAsyncIterator(): AsyncIterator<number> {
  return (async function* () {
    yield 1
    yield 2
  })()
}

function returnsAsyncIterable(): AsyncIterable<number> {
  return (async function* () {
    yield 1
    yield 2
  })()
}
