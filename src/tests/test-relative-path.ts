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

    const data = JSON.parse(result.result.content[0].text)
    console.log('✅ 相对路径解析成功:', {
      文件路径: relativePath,
      函数: data.functions.length,
      类: data.classes.length,
      变量: data.variables.length
    })

    console.log('\n--- 测试第二次解析（应该命中缓存）---')
    const result2 = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: relativePath
      }
    })) as any

    const data2 = JSON.parse(result2.result.content[0].text)
    console.log('✅ 第二次解析成功:', {
      文件路径: relativePath,
      函数: data2.functions.length,
      类: data2.classes.length,
      变量: data2.variables.length
    })

    await client.shutdown()
    await client.close()

    console.log('\n✅ 相对路径测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
