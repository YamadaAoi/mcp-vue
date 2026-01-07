import { MCPServerTestClient } from './test-helper'

export async function testComplexRelativePaths() {
  console.log('=== 复杂相对路径测试 ===\n')

  const client = new MCPServerTestClient()

  try {
    await client.initialize()

    const testCases = [
      {
        name: '简单相对路径',
        path: 'src/tests/fixtures/test-simple.ts'
      },
      {
        name: '深层相对路径',
        path: 'src/tests/fixtures/test-complex-typescript.ts'
      },
      {
        name: 'Vue 文件相对路径',
        path: 'src/tests/fixtures/test-vue.vue'
      },
      {
        name: 'TypeScript 文件相对路径',
        path: 'src/tests/fixtures/test-typescript.ts'
      }
    ]

    for (const testCase of testCases) {
      console.log(`--- 测试 ${testCase.name}: ${testCase.path} ---`)

      const result = (await client.sendRequest('tools/call', {
        name: 'parse_code',
        arguments: {
          filepath: testCase.path
        }
      })) as any

      const data = JSON.parse(result.result.content[0].text)
      console.log('✅ 解析成功:', {
        函数: data.functions.length,
        类: data.classes.length,
        类型: data.types.length,
        变量: data.variables.length
      })
    }

    console.log('\n--- 测试缓存一致性 ---')
    const path = 'src/tests/fixtures/test-simple.ts'

    const result1 = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: { filepath: path }
    })) as any

    const result2 = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: { filepath: path }
    })) as any

    const data1 = JSON.parse(result1.result.content[0].text)
    const data2 = JSON.parse(result2.result.content[0].text)

    console.log('✅ 两次解析结果一致:', {
      函数数量相同: data1.functions.length === data2.functions.length,
      类数量相同: data1.classes.length === data2.classes.length,
      变量数量相同: data1.variables.length === data2.variables.length
    })

    await client.shutdown()
    await client.close()

    console.log('\n✅ 复杂相对路径测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
