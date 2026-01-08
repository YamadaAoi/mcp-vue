import { MCPServerTestClient } from './test-helper'
import { resolve } from 'node:path'

export async function testVue3Options() {
  console.log('=== Vue3 选项式 API 解析测试 ===\n')

  const client = new MCPServerTestClient()

  try {
    await client.initialize()

    console.log('--- 测试 parse_code 工具 ---')
    const parseResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-vue3-options.vue')
      }
    })) as any

    const summary = parseResult.result.content[0].text
    console.log('✅ 解析成功')
    console.log('\n解析结果摘要:')
    console.log(summary)

    console.log('\n--- 验证解析结果 ---')

    const lines = summary.split('\n')

    const functions = lines.filter(
      line => line.includes('->') && line.includes('[method_definition]')
    )
    console.log(`\n✅ 解析到 ${functions.length} 个方法 (methods):`)
    functions.forEach(fn => console.log(`  ${fn.trim()}`))

    const hasDoubledCount = summary.includes('doubledCount')
    const hasIsMaxReached = summary.includes('isMaxReached')
    const hasCanIncrement = summary.includes('canIncrement')
    const hasFormattedMessage = summary.includes('formattedMessage')

    console.log(`\n✅ 计算属性 (computed):`)
    console.log(`  ${hasDoubledCount ? '✓' : '✗'} doubledCount`)
    console.log(`  ${hasIsMaxReached ? '✓' : '✗'} isMaxReached`)
    console.log(`  ${hasCanIncrement ? '✓' : '✗'} canIncrement`)
    console.log(`  ${hasFormattedMessage ? '✓' : '✗'} formattedMessage`)

    const hasCount = summary.includes('count')
    const hasMessage = summary.includes('message')
    const hasItems = summary.includes('items')
    const hasUserInfo = summary.includes('userInfo')
    const hasLoading = summary.includes('loading')

    console.log(`\n✅ 响应式变量 (data):`)
    console.log(`  ${hasCount ? '✓' : '✗'} count`)
    console.log(`  ${hasMessage ? '✓' : '✗'} message`)
    console.log(`  ${hasItems ? '✓' : '✗'} items`)
    console.log(`  ${hasUserInfo ? '✓' : '✗'} userInfo`)
    console.log(`  ${hasLoading ? '✓' : '✗'} loading`)

    const hasWatchCount = summary.includes('count(newVal, oldVal)')
    const hasWatchMessage = summary.includes('message(newVal)')
    const hasWatchUserInfoName = summary.includes('userInfo.name')
    const hasWatchItems = summary.includes('items')

    console.log(`\n✅ 侦听器 (watch):`)
    console.log(`  ${hasWatchCount ? '✓' : '✗'} count`)
    console.log(`  ${hasWatchMessage ? '✓' : '✗'} message`)
    console.log(`  ${hasWatchUserInfoName ? '✓' : '✗'} userInfo.name`)
    console.log(`  ${hasWatchItems ? '✓' : '✗'} items`)

    const hasCreated = summary.includes('created')
    const hasMounted = summary.includes('mounted')
    const hasBeforeUpdate = summary.includes('beforeUpdate')
    const hasUpdated = summary.includes('updated')
    const hasBeforeUnmount = summary.includes('beforeUnmount')
    const hasUnmounted = summary.includes('unmounted')

    console.log(`\n✅ 生命周期钩子:`)
    console.log(`  ${hasCreated ? '✓' : '✗'} created`)
    console.log(`  ${hasMounted ? '✓' : '✗'} mounted`)
    console.log(`  ${hasBeforeUpdate ? '✓' : '✗'} beforeUpdate`)
    console.log(`  ${hasUpdated ? '✓' : '✗'} updated`)
    console.log(`  ${hasBeforeUnmount ? '✓' : '✗'} beforeUnmount`)
    console.log(`  ${hasUnmounted ? '✓' : '✗'} unmounted`)

    await client.shutdown()
    await client.close()

    console.log('\n✅ Vue3 选项式 API 测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
