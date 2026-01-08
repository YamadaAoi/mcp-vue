import { MCPServerTestClient } from './test-helper'
import { resolve } from 'node:path'
import { cacheManager } from '../services/ast/index'

export async function testVue3Composition(): Promise<boolean> {
  const client = new MCPServerTestClient()
  const testFile = resolve('src/tests/fixtures/test-vue3-composition.vue')

  console.log('=== Vue3 组合式 API 测试 ===\n')

  try {
    await client.initialize()

    cacheManager.clear()
    console.log('已清除缓存')

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

    console.log('\n--- 验证解析结果 ---')

    if (!summary.includes('Language: vue')) {
      throw new Error('语言识别错误')
    }
    console.log('✅ 语言识别正确')

    if (!summary.includes('## Functions (1)')) {
      throw new Error('函数数量不正确')
    }
    console.log('✅ 函数数量正确 (1)')

    if (!summary.includes('## Variables (8)')) {
      throw new Error('变量数量不正确')
    }
    console.log('✅ 变量数量正确 (8)')

    if (!summary.includes('## Vue Options API')) {
      throw new Error('缺少 Vue Options API 部分')
    }
    console.log('✅ 包含 Vue Options API 部分')

    if (
      summary.includes('Data Properties:') &&
      !summary.includes('Data Properties:\n\n')
    ) {
      throw new Error('组合式 API 不应该有 data properties')
    }
    console.log('✅ 组合式 API 没有 data properties (正确)')

    if (
      summary.includes('Computed Properties:') &&
      !summary.includes('Computed Properties:\n\n')
    ) {
      throw new Error('组合式 API 不应该有 computed properties')
    }
    console.log('✅ 组合式 API 没有 computed properties (正确)')

    if (
      summary.includes('Watch Properties:') &&
      !summary.includes('Watch Properties:\n\n')
    ) {
      throw new Error('组合式 API 不应该有 watch properties')
    }
    console.log('✅ 组合式 API 没有 watch properties (正确)')

    if (summary.includes('Methods:') && !summary.includes('Methods:\n\n')) {
      throw new Error('组合式 API 不应该有 methods')
    }
    console.log('✅ 组合式 API 没有 methods (正确)')

    if (
      summary.includes('Lifecycle Hooks:') &&
      !summary.includes('Lifecycle Hooks:\n\n')
    ) {
      throw new Error('组合式 API 不应该有 lifecycle hooks')
    }
    console.log('✅ 组合式 API 没有 lifecycle hooks (正确)')

    await client.shutdown()
    await client.close()

    console.log('\n✅ Vue3 组合式 API 测试通过\n')
    return true
  } catch (error) {
    await client.close()
    console.error('Error testing Vue3 Composition API:', error)
    return false
  }
}
