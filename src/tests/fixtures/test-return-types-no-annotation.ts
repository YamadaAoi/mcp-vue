function returnsString() {
  return 'hello'
}

function returnsNumber() {
  return 42
}

function returnsBoolean() {
  return true
}

function returnsVoid() {
  console.log('void')
}

function returnsNull() {
  return null
}

function returnsUndefined() {
  return undefined
}

function returnsObject() {
  return { name: 'Alice', age: 30 }
}

function returnsArray() {
  return [1, 2, 3]
}

function returnsGenericArray() {
  return ['a', 'b', 'c']
}

function returnsPromise() {
  return Promise.resolve('hello')
}

function returnsPromiseNumber() {
  return Promise.resolve(42)
}

function returnsPromiseObject() {
  return Promise.resolve({ id: 1, name: 'test' })
}

function returnsPromiseArray() {
  return Promise.resolve([1, 2, 3])
}

async function asyncReturnsString() {
  return 'hello'
}

async function asyncReturnsNumber() {
  return 42
}

async function asyncReturnsObject() {
  return { id: 1 }
}

function returnsUnion() {
  return 'hello'
}

function returnsIntersection() {
  return { name: 'Alice', age: 30 }
}

function returnsFunction() {
  return x => x.toString()
}

function returnsTuple() {
  return ['hello', 42]
}

function returnsAny() {
  return 'anything'
}

function returnsUnknown() {
  return 'unknown'
}

function returnsNever() {
  throw new Error('never')
}

function returnsOptional() {
  return {}
}

function returnsReadonly() {
  return [1, 2, 3]
}

function returnsGeneric(value) {
  return value
}

function returnsMultipleGenerics(key, value) {
  return new Map([[key, value]])
}

function returnsNestedGeneric() {
  return Promise.resolve({ data: [{ id: 1 }] })
}

function returnsComplexUnion() {
  return 'hello'
}

function returnsComplexObject() {
  return {
    id: 1,
    name: 'test',
    tags: ['a', 'b']
  }
}

function returnsArrayUnion() {
  return ['a', 1, 'b', 2]
}

function returnsPromiseUnion() {
  return Promise.resolve('hello')
}

function returnsRecord() {
  return { a: 1, b: 2 }
}

function returnsPartial() {
  return { name: 'Alice' }
}

function returnsRequired() {
  return { name: 'Alice', age: 30 }
}

function returnsPick() {
  return { name: 'Alice', age: 30 }
}

function returnsOmit() {
  return { name: 'Alice', age: 30 }
}

function returnsReturnTypeOf() {
  return 'hello'
}

function returnsParametersType() {
  return [1, 'hello']
}

function returnsConstructor() {
  return class {
    method() {}
  }
}

function returnsThis() {
  return this
}

function returnsInfer(value) {
  return Array.isArray(value) ? value[0] : value
}

function returnsConditional(value) {
  return typeof value === 'string' ? value : 42
}

function returnsAwaited(value) {
  return value as any
}

function returnsUppercase() {
  return 'HELLO' as any
}

function returnsLowercase() {
  return 'hello' as any
}

function returnsCapitalize() {
  return 'Hello' as any
}

function returnsUncapitalize() {
  return 'hello' as any
}

function returnsTemplateLiterals() {
  return 'prefix-test' as any
}

function returnsBigInt() {
  return 123n
}

function returnsSymbol() {
  return Symbol('test')
}

function returnsRegExp() {
  return /test/g
}

function returnsDate() {
  return new Date()
}

function returnsError() {
  return new Error('test')
}

function returnsMap() {
  return new Map([['a', 1]])
}

function returnsSet() {
  return new Set([1, 2, 3])
}

function returnsWeakMap() {
  return new WeakMap()
}

function returnsWeakSet() {
  return new WeakSet()
}

function returnsIterator() {
  return [1, 2, 3][Symbol.iterator]()
}

function returnsIterable() {
  return [1, 2, 3]
}

function returnsAsyncIterator() {
  return (async function* () {
    yield 1
    yield 2
  })()
}

function returnsAsyncIterable() {
  return (async function* () {
    yield 1
    yield 2
  })()
}
