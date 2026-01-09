import { MCPServerTestClient } from './test-helper'
import { resolve } from 'node:path'

export async function testReturnTypes(): Promise<boolean> {
  const client = new MCPServerTestClient()
  const testFile = resolve('src/tests/fixtures/test-return-types.ts')

  console.log('=== Return Types Test ===\n')

  try {
    await client.initialize()

    console.log('--- 测试 parse_code 工具 ---')
    const parseResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: testFile
      }
    })) as any

    const summary = parseResult.result.content[0].text
    console.log('✅ 解析成功')
    console.log('\n解析结果摘要:')
    console.log(summary)

    await client.shutdown()
    await client.close()

    console.log('\n✅ Return Types 测试通过\n')
    return true
  } catch (error) {
    await client.close()
    console.error('Error testing Return Types:', error)
    return false
  }
}
