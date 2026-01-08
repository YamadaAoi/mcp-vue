import { MCPServerTestClient } from './test-helper'
import { resolve } from 'node:path'

export async function testDebugLogs(): Promise<boolean> {
  const client = new MCPServerTestClient()
  const testFile = resolve('src/tests/fixtures/test-vue3-composition.vue')

  console.log('=== 测试调试日志 ===\n')

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

    return true
  } catch (error) {
    console.error('\n❌ 测试失败:', error)
    return false
  } finally {
    await client.shutdown()
    await client.close()
  }
}
