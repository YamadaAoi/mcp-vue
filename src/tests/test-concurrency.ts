import { MCPServerTestClient } from './test-helper'
import { resolve } from 'path'

export async function testConcurrency() {
  console.log('=== 并发处理测试 ===\n')

  const client = new MCPServerTestClient()

  try {
    await client.initialize()

    console.log('同时发送 3 个并发请求...\n')

    const startTime = Date.now()

    const concurrentRequests = [
      client.sendRequest('tools/call', {
        name: 'parse_code',
        arguments: { filepath: resolve('src/tests/fixtures/test-simple.ts') }
      }),
      client.sendRequest('tools/call', {
        name: 'parse_code',
        arguments: { filepath: resolve('src/tests/fixtures/test-simple.ts') }
      }),
      client.sendRequest('tools/call', {
        name: 'parse_code',
        arguments: { filepath: resolve('src/tests/fixtures/test-simple.ts') }
      })
    ]

    const concurrentResults = await Promise.all(concurrentRequests)
    const endTime = Date.now()

    console.log(
      '✅ 并发请求全部完成，共处理',
      concurrentResults.length,
      '个请求'
    )
    console.log('⏱️  总耗时:', endTime - startTime, 'ms')
    console.log(
      '⏱️  平均每个请求:',
      Math.round((endTime - startTime) / concurrentResults.length),
      'ms'
    )

    await client.shutdown()
    await client.close()

    console.log('\n✅ 并发处理测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
