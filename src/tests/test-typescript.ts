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

    const parseData = JSON.parse(parseResult.result.content[0].text)
    console.log('✅ 解析成功，找到:', {
      函数: parseData.functions.length,
      类: parseData.classes.length,
      类型: parseData.types.length,
      导出: parseData.exports.length,
      变量: parseData.variables.length,
      导入: parseData.imports.length
    })

    console.log('\n--- 验证函数信息 ---')
    console.log(
      '函数列表:',
      parseData.functions.map((f: any) => f.name).join(', ')
    )

    console.log('\n--- 验证类型信息 ---')
    console.log('类型列表:', parseData.types.map((t: any) => t.name).join(', '))

    console.log('\n--- 验证导出信息 ---')
    console.log(
      '导出列表:',
      parseData.exports.map((e: any) => e.name).join(', ')
    )

    await client.shutdown()
    await client.close()

    console.log('\n✅ TypeScript 解析测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
