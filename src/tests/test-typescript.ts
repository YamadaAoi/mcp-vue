import { MCPServerTestClient } from './test-helper'
import { resolve } from 'node:path'

export async function testTypeScript() {
  console.log('=== TypeScript 解析测试 ===\n')

  const client = new MCPServerTestClient()

  try {
    await client.initialize()

    console.log('--- 测试 parse_code 工具 ---')
    const parseResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-typescript.ts')
      }
    })) as any

    const summary = parseResult.result.content[0].text
    console.log('✅ 解析成功')
    console.log('\n解析结果摘要:')
    console.log(summary)

    await client.shutdown()
    await client.close()

    console.log('\n✅ TypeScript 解析测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
