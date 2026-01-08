import { MCPServerTestClient } from './test-helper'
import { resolve } from 'node:path'
import { cacheManager } from '../services/ast/index'

export async function testTopLevelCalls(): Promise<boolean> {
  const client = new MCPServerTestClient()
  const testFile = resolve('src/tests/fixtures/test-top-level-calls.ts')

  console.log('测试顶层函数调用提取...\n')

  try {
    await client.initialize()

    cacheManager.clear()
    console.log('已清除缓存')

    const parseResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: testFile
      }
    })) as any

    const summary = parseResult.result.content[0].text

    console.log('=== 解析结果 ===\n')
    console.log(summary)
    console.log('\n=== 测试 ===\n')

    if (!summary.includes('## Functions')) {
      console.log('❌ 没有提取到任何函数')
      return false
    }

    const functionMatch = summary.match(/## Functions \((\d+)\)/)
    if (!functionMatch) {
      console.log('❌ 无法解析函数数量')
      return false
    }

    const functionCount = parseInt(functionMatch[1])
    console.log(`✅ 提取到 ${functionCount} 个函数`)

    if (summary.includes('testFunction')) {
      console.log('✅ 提取到 testFunction')
    } else {
      console.log('❌ 未提取到 testFunction')
      return false
    }

    if (summary.includes('onMounted')) {
      console.log('✅ 提取到 onMounted')
    } else {
      console.log('❌ 未提取到 onMounted')
      return false
    }

    if (summary.includes('watch')) {
      console.log('✅ 提取到 watch')
    } else {
      console.log('❌ 未提取到 watch')
      return false
    }

    if (summary.includes('main')) {
      console.log('✅ 提取到 main')
    } else {
      console.log('❌ 未提取到 main')
      return false
    }

    if (summary.includes('initApp')) {
      console.log('✅ 提取到 initApp')
    } else {
      console.log('❌ 未提取到 initApp')
      return false
    }

    console.log('\n=== 完整函数列表 ===\n')
    const functionSection = summary.split('## Functions')[1].split('\n\n')[0]
    console.log(functionSection)

    await client.shutdown()
    await client.close()

    return true
  } catch (error) {
    await client.close()
    console.error('Error:', error)
    return false
  }
}

testTopLevelCalls().then(success => {
  if (success) {
    console.log('\n✅ 所有测试通过')
    process.exit(0)
  } else {
    console.log('\n❌ 测试失败')
    process.exit(1)
  }
})
