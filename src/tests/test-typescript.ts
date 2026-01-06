import { MCPServerTestClient, testCode } from './test-helper'

export async function testTypeScript() {
  console.log('=== TypeScript 解析测试 ===\n')

  const client = new MCPServerTestClient()

  try {
    await client.initialize()

    console.log('--- 测试 parse_code 工具 ---')
    const parseResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        code: testCode,
        filename: 'test.ts'
      }
    })) as any

    const parseData = JSON.parse(parseResult.result.content[0].text)
    console.log('✅ 解析成功，找到:', {
      函数: parseData.functions.length,
      类: parseData.classes.length,
      类型: parseData.types.length,
      导出: parseData.exports.length
    })

    console.log('\n--- 测试 find_functions 工具 ---')
    const functionsResult = (await client.sendRequest('tools/call', {
      name: 'find_functions',
      arguments: {
        code: testCode,
        filename: 'test.ts'
      }
    })) as any

    const functionsData = JSON.parse(functionsResult.result.content[0].text)
    console.log(
      '✅ 找到',
      functionsData.count,
      '个函数:',
      functionsData.functions.map((f: any) => f.name).join(', ')
    )

    console.log('\n--- 测试 find_classes 工具 ---')
    const classesResult = (await client.sendRequest('tools/call', {
      name: 'find_classes',
      arguments: {
        code: testCode,
        filename: 'test.ts'
      }
    })) as any

    const classesData = JSON.parse(classesResult.result.content[0].text)
    console.log(
      '✅ 找到',
      classesData.count,
      '个类:',
      classesData.classes.map((c: any) => c.name).join(', ')
    )

    console.log('\n--- 测试 find_types 工具 ---')
    const typesResult = (await client.sendRequest('tools/call', {
      name: 'find_types',
      arguments: {
        code: testCode,
        filename: 'test.ts'
      }
    })) as any

    const typesData = JSON.parse(typesResult.result.content[0].text)
    console.log(
      '✅ 找到',
      typesData.count,
      '个类型:',
      typesData.types.map((t: any) => t.name).join(', ')
    )

    console.log('\n--- 测试 find_exports 工具 ---')
    const exportsResult = (await client.sendRequest('tools/call', {
      name: 'find_exports',
      arguments: {
        code: testCode,
        filename: 'test.ts'
      }
    })) as any

    const exportsData = JSON.parse(exportsResult.result.content[0].text)
    console.log(
      '✅ 找到',
      exportsData.count,
      '个导出:',
      exportsData.exports.map((e: any) => e.name).join(', ')
    )

    await client.shutdown()
    await client.close()

    console.log('\n✅ TypeScript 解析测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
