import { MCPServerTestClient } from './test-helper'
import { resolve } from 'node:path'

export async function testComplexVue() {
  console.log('=== 复杂 Vue 解析测试 ===\n')

  const client = new MCPServerTestClient()

  try {
    await client.initialize()

    console.log('--- 测试基础 Vue 文件解析 ---')
    const basicVueResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-vue.vue')
      }
    })) as any

    const basicSummary = basicVueResult.result.content[0].text
    console.log('✅ 基础 Vue 文件解析成功')
    console.log('\n解析结果摘要:')
    console.log(basicSummary)

    console.log('\n--- 测试复杂 Vue 文件解析 ---')
    const complexVueResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-complex-vue.vue')
      }
    })) as any

    const complexSummary = complexVueResult.result.content[0].text
    console.log('✅ 复杂 Vue 文件解析成功')
    console.log('\n解析结果摘要:')
    console.log(complexSummary)

    await client.shutdown()
    await client.close()

    console.log('\n✅ 复杂 Vue 解析测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
