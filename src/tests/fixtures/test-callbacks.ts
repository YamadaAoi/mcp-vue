export function testFunction() {
  console.log('test')
}

const arr = [1, 2, 3]
const doubled = arr.map(n => n * 2)
const sum = arr.reduce((acc, curr) => acc + curr, 0)
