import { testBasic } from './test-basic'
import { testTypeScript } from './test-typescript'
import { testVue } from './test-vue'
import { testConcurrency } from './test-concurrency'
import { testComplexTypeScript } from './test-complex-typescript'
import { testComplexVue } from './test-complex-vue'
import { testEdgeCases } from './test-edge-cases'
import { testPerformance } from './test-performance'
import { testRelativePath } from './test-relative-path'
import { testComplexRelativePaths } from './test-complex-relative-paths'
import { testVue2Features } from './test-vue2'
import { testVue3Options } from './test-vue3-options'
import { testVue3Composition } from './test-vue3-composition'
import { testDebugLogs } from './test-debug-logs'
import { testCallbacks } from './test-callbacks'
import { testCallbacksExtended } from './test-callbacks-extended'
import { testTopLevelCalls } from './test-top-level-calls'
import { testVueSimple } from './test-vue-simple'
import { testReturnTypes } from './test-return-types'
import { testReturnTypesNoAnnotation } from './test-return-types-no-annotation'
import { testNoReturnType } from './test-no-return-type'

async function runAllTests() {
  console.log('╔════════════════════════════════════════╗')
  console.log('║   MCP 服务器测试套件                 ║')
  console.log('╚════════════════════════════════════════╝\n')

  const tests = [
    { name: '基础功能', fn: testBasic },
    { name: 'TypeScript 解析', fn: testTypeScript },
    { name: 'Vue 解析', fn: testVue },
    { name: '并发处理', fn: testConcurrency },
    { name: '复杂 TypeScript 解析', fn: testComplexTypeScript },
    { name: '复杂 Vue 解析', fn: testComplexVue },
    { name: '边界情况', fn: testEdgeCases },
    { name: '性能测试', fn: testPerformance },
    { name: '相对路径', fn: testRelativePath },
    { name: '复杂相对路径', fn: testComplexRelativePaths },
    { name: 'Vue2 特性', fn: testVue2Features },
    { name: 'Vue3 选项式 API', fn: testVue3Options },
    { name: 'Vue3 组合式 API', fn: testVue3Composition },
    { name: '调试日志', fn: testDebugLogs },
    { name: '回调函数检测', fn: testCallbacks },
    { name: '扩展回调函数检测', fn: testCallbacksExtended },
    { name: '顶层函数调用提取', fn: testTopLevelCalls },
    { name: 'Vue 简单模板（无 Options API）', fn: testVueSimple },
    { name: '函数返回值类型提取', fn: testReturnTypes },
    { name: '无返回值类型标注的函数', fn: testReturnTypesNoAnnotation },
    { name: '简单无返回值类型测试', fn: testNoReturnType }
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
    concurrency: testConcurrency,
    complexTypescript: testComplexTypeScript,
    complexVue: testComplexVue,
    edgeCases: testEdgeCases,
    performance: testPerformance,
    relativePath: testRelativePath,
    complexRelativePaths: testComplexRelativePaths,
    vue2: testVue2Features,
    vue3options: testVue3Options,
    vue3composition: testVue3Composition,
    debuglogs: testDebugLogs,
    callbacks: testCallbacks,
    callbacksextended: testCallbacksExtended,
    toplevelcalls: testTopLevelCalls,
    vuesimple: testVueSimple,
    returntypes: testReturnTypes,
    returntypesnoannotation: testReturnTypesNoAnnotation,
    noreturntype: testNoReturnType
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
