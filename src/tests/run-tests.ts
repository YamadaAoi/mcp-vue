import { testBasic } from './test-basic'
import { testTypeScript } from './test-typescript'
import { testVue } from './test-vue'
import { testConcurrency } from './test-concurrency'

async function runAllTests() {
  console.log('╔════════════════════════════════════════╗')
  console.log('║   MCP 服务器测试套件                 ║')
  console.log('╚════════════════════════════════════════╝\n')

  const tests = [
    { name: '基础功能', fn: testBasic },
    { name: 'TypeScript 解析', fn: testTypeScript },
    { name: 'Vue 解析', fn: testVue },
    { name: '并发处理', fn: testConcurrency }
  ]

  const failedTests: string[] = []

  for (const test of tests) {
    try {
      await test.fn()
    } catch (error) {
      console.error(`❌ ${test.name}测试失败:`, error)
      failedTests.push(test.name)
    }
  }

  console.log('╔════════════════════════════════════════╗')
  if (failedTests.length === 0) {
    console.log('║   ✅ 所有测试通过！                   ║')
  } else {
    console.log('║   ❌ 部分测试失败                     ║')
    console.log(`║   失败的测试: ${failedTests.join(', ')}`)
  }
  console.log('╚════════════════════════════════════════╝\n')

  if (failedTests.length > 0) {
    process.exit(1)
  }
}

async function runSpecificTest(testName: string) {
  const tests: Record<string, () => Promise<void>> = {
    basic: testBasic,
    typescript: testTypeScript,
    vue: testVue,
    concurrency: testConcurrency
  }

  const test = tests[testName]

  if (!test) {
    console.error(`❌ 未找到测试: ${testName}`)
    console.error('可用的测试:', Object.keys(tests).join(', '))
    process.exit(1)
  }

  try {
    await test()
  } catch (error) {
    console.error(`❌ 测试失败:`, error)
    process.exit(1)
  }
}

const args = process.argv.slice(2)

if (args.length === 0) {
  runAllTests()
} else {
  runSpecificTest(args[0])
}
