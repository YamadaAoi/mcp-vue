import { MCPServerTestClient } from './test-helper'
import { resolve } from 'node:path'

export async function testReturnTypesNoAnnotation(): Promise<boolean> {
  const client = new MCPServerTestClient()
  const testFile = resolve(
    'src/tests/fixtures/test-return-types-no-annotation.ts'
  )

  console.log('=== 测试无显式返回值类型标注的函数 ===\n')

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

    const functions = parseResult.result.functions || []

    console.log('\n=== 返回值类型分析 ===\n')

    const withReturnType = functions.filter((f: any) => f.returnType)
    const withoutReturnType = functions.filter((f: any) => !f.returnType)

    console.log(`有返回值类型标注: ${withReturnType.length}`)
    console.log(`无返回值类型标注: ${withoutReturnType.length}`)

    if (withoutReturnType.length > 0) {
      console.log('\n无返回值类型标注的函数:')
      withoutReturnType.slice(0, 10).forEach((f: any) => {
        console.log(`  - ${f.name} -> ${f.returnType || 'void'}`)
      })
      if (withoutReturnType.length > 10) {
        console.log(`  ... 还有 ${withoutReturnType.length - 10} 个函数`)
      }
    }

    await client.shutdown()
    await client.close()

    console.log('\n✅ Return Types No Annotation 测试通过\n')
    return true
  } catch (error) {
    await client.close()
    console.error('Error testing Return Types No Annotation:', error)
    return false
  }
}
