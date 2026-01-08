import { MCPServerTestClient } from './test-helper'
import { resolve } from 'node:path'

export async function testCallbacks(): Promise<boolean> {
  const client = new MCPServerTestClient()
  const testFile = resolve('src/tests/fixtures/test-callbacks.ts')

  console.log('=== 测试回调函数检测 ===\n')

  try {
    await client.initialize()

    console.log('--- 测试 parse_code 工具 ---')
    const parseResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: testFile
      }
    })) as { result: { content: Array<{ type: string; text: string }> } }

    console.log('\n✅ 解析成功')

    const text = parseResult.result.content[0].text
    console.log('\n解析结果摘要:')
    console.log(text)

    const functions = text.match(/## Functions \((\d+)\)/)
    const functionCount = functions ? parseInt(functions[1]) : 0

    console.log(`\n--- 验证解析结果 ---`)
    console.log(`函数数量: ${functionCount}`)
    if (functionCount === 1) {
      console.log('✅ 函数数量正确（应该只有 testFunction）')
      return true
    } else {
      console.log(`❌ 函数数量不正确（应该是 1，实际是 ${functionCount}）`)
      return false
    }
  } catch (error) {
    console.error('\n❌ 测试失败:', error)
    return false
  } finally {
    await client.shutdown()
    await client.close()
  }
}
