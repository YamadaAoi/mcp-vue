import { MCPServerTestClient } from './test-helper'
import { resolve } from 'path'

export async function testComplexTypeScript() {
  console.log('=== 复杂 TypeScript 解析测试 ===\n')

  const client = new MCPServerTestClient()

  try {
    await client.initialize()

    console.log('--- 测试复杂代码解析 ---')
    const complexParseResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-complex-typescript.ts')
      }
    })) as any

    const complexSummary = complexParseResult.result.content[0].text
    console.log('✅ 复杂代码解析成功')
    console.log('\n解析结果摘要:')
    console.log(complexSummary)

    console.log('\n--- 测试大型代码解析 ---')
    const largeParseResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-large.ts')
      }
    })) as any

    const largeSummary = largeParseResult.result.content[0].text
    console.log('✅ 大型代码解析成功')
    console.log('\n解析结果摘要:')
    console.log(largeSummary)

    await client.shutdown()
    await client.close()

    console.log('\n✅ 复杂 TypeScript 解析测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
