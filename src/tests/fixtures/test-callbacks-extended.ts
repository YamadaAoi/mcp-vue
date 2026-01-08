export function testFunction() {
  console.log('test')
}

const arr = [1, 2, 3]

const doubled1 = arr.map(function (n) {
  return n * 2
})
const doubled2 = arr.map(function double(n) {
  return n * 2
})

const sum1 = arr.reduce(function (acc, curr) {
  return acc + curr
}, 0)
const sum2 = arr.reduce(function add(acc, curr) {
  return acc + curr
}, 0)

const filtered1 = arr.filter(function (n) {
  return n > 2
})
const filtered2 = arr.filter(function isGreaterThanTwo(n) {
  return n > 2
})

const found1 = arr.find(function (n) {
  return n === 3
})
const found2 = arr.find(function equalsThree(n) {
  return n === 3
})
