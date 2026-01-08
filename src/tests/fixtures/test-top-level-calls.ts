function testFunction() {
  console.log('test')
}

const arr = [1, 2, 3]
arr.map(n => n * 2)

onMounted(() => {
  console.log('mounted')
})

watch(
  () => {
    console.log('watch')
  },
  () => {
    console.log('callback')
  }
)

main()

initApp()
