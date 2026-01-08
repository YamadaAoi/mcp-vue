import { MCPServerTestClient } from './test-helper'

export async function testRelativePath() {
  console.log('=== 相对路径测试 ===\n')

  const client = new MCPServerTestClient()

  try {
    await client.initialize()

    console.log('--- 测试相对路径解析 ---')
    const relativePath = 'src/tests/fixtures/test-simple.ts'

    const result = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: relativePath
      }
    })) as any

    const summary = result.result.content[0].text
    console.log('✅ 相对路径解析成功:', {
      文件路径: relativePath
    })
    console.log('\n解析结果摘要:')
    console.log(summary)

    console.log('\n--- 测试第二次解析（应该命中缓存）---')
    const result2 = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: relativePath
      }
    })) as any

    const summary2 = result2.result.content[0].text
    console.log('✅ 第二次解析成功:', {
      文件路径: relativePath
    })
    console.log('\n解析结果摘要:')
    console.log(summary2)

    await client.shutdown()
    await client.close()

    console.log('\n✅ 相对路径测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
