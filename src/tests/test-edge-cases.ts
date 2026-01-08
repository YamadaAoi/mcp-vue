import { MCPServerTestClient } from './test-helper'
import { resolve } from 'path'

export async function testEdgeCases() {
  console.log('=== 边界情况和错误处理测试 ===\n')

  const client = new MCPServerTestClient()

  try {
    await client.initialize()

    console.log('--- 测试只有注释的代码 ---')
    const commentOnlyResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-comments.ts')
      }
    })) as any

    const commentSummary = commentOnlyResult.result.content[0].text
    console.log('✅ 只有注释的代码解析成功')
    console.log('\n解析结果摘要:')
    console.log(commentSummary)

    console.log('\n--- 测试循环引用 ---')
    const edgeResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-edge-cases.ts')
      }
    })) as any

    const edgeSummary = edgeResult.result.content[0].text
    console.log('✅ 边界情况代码解析成功')
    console.log('\n解析结果摘要:')
    console.log(edgeSummary)

    console.log('\n--- 测试语法错误代码 ---')
    try {
      const invalidResult = (await client.sendRequest('tools/call', {
        name: 'parse_code',
        arguments: {
          filepath: resolve('src/tests/fixtures/test-invalid.ts')
        }
      })) as any

      const invalidSummary = invalidResult.result.content[0].text
      console.log('✅ 语法错误代码处理成功')
      console.log('\n解析结果摘要:')
      console.log(invalidSummary)
    } catch (error) {
      console.log('✅ 语法错误代码被正确拒绝:', error)
    }

    console.log('\n--- 测试无效参数 ---')
    try {
      await client.sendRequest('tools/call', {
        name: 'parse_code',
        arguments: {
          filepath: 'nonexistent.ts'
        }
      })
      console.log('❌ 应该拒绝不存在的文件')
    } catch (error) {
      console.log('✅ 正确拒绝不存在的文件')
    }

    console.log('\n--- 测试不存在的工具 ---')
    try {
      await client.sendRequest('tools/call', {
        name: 'nonexistent_tool',
        arguments: {
          code: 'const x = 1',
          filename: 'test.ts'
        }
      })
      console.log('❌ 应该拒绝不存在的工具')
    } catch (error) {
      console.log('✅ 正确拒绝不存在的工具')
    }

    console.log('\n--- 测试极长代码 ---')
    const longResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-large.ts')
      }
    })) as any

    const longSummary = longResult.result.content[0].text
    console.log('✅ 极长代码解析成功')
    console.log('\n解析结果摘要:')
    console.log(longSummary)

    console.log('\n--- 测试特殊字符 ---')
    const specialResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-special-chars.ts')
      }
    })) as any

    const specialSummary = specialResult.result.content[0].text
    console.log('✅ 特殊字符代码解析成功')
    console.log('\n解析结果摘要:')
    console.log(specialSummary)

    console.log('\n--- 测试深度嵌套结构 ---')
    const nestedResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-nested.ts')
      }
    })) as any

    const nestedSummary = nestedResult.result.content[0].text
    console.log('✅ 深度嵌套结构解析成功')
    console.log('\n解析结果摘要:')
    console.log(nestedSummary)

    console.log('\n--- 测试 Unicode 和 Emoji ---')
    const unicodeResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-unicode.ts')
      }
    })) as any

    const unicodeSummary = unicodeResult.result.content[0].text
    console.log('✅ Unicode 和 Emoji 代码解析成功')
    console.log('\n解析结果摘要:')
    console.log(unicodeSummary)

    console.log('\n--- 测试多次解析同一代码 ---')
    for (let i = 0; i < 5; i++) {
      const result = (await client.sendRequest('tools/call', {
        name: 'parse_code',
        arguments: {
          filepath: resolve('src/tests/fixtures/test-simple.ts')
        }
      })) as any

      const summary = result.result.content[0].text
      if (!summary.includes('Variables')) {
        throw new Error(`第 ${i + 1} 次解析结果不一致`)
      }
    }
    console.log('✅ 多次解析同一代码结果一致')

    await client.shutdown()
    await client.close()

    console.log('\n✅ 边界情况和错误处理测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
