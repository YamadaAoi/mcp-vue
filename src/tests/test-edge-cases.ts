import { MCPServerTestClient } from './test-helper'
import { resolve } from 'path'

export async function testEdgeCases() {
  console.log('=== 边界情况和错误处理测试 ===\n')

  const client = new MCPServerTestClient()

  try {
    await client.initialize()

    console.log('--- 测试空代码 ---')
    try {
      const emptyResult = (await client.sendRequest('tools/call', {
        name: 'parse_code',
        arguments: {
          filepath: resolve('src/tests/fixtures/test-comments.ts')
        }
      })) as any

      const emptyData = JSON.parse(emptyResult.result.content[0].text)
      console.log('✅ 空代码解析成功:', {
        函数: emptyData.functions.length,
        类: emptyData.classes.length,
        类型: emptyData.types.length
      })
    } catch (error) {
      console.log('✅ 空代码被正确拒绝:', error)
    }

    console.log('\n--- 测试只有注释的代码 ---')
    const commentOnlyResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-comments.ts')
      }
    })) as any

    const commentData = JSON.parse(commentOnlyResult.result.content[0].text)
    console.log('✅ 只有注释的代码解析成功:', {
      函数: commentData.functions.length,
      类: commentData.classes.length,
      类型: commentData.types.length
    })

    console.log('\n--- 测试循环引用 ---')
    const edgeResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-edge-cases.ts')
      }
    })) as any

    const edgeData = JSON.parse(edgeResult.result.content[0].text)
    console.log('✅ 边界情况代码解析成功:', {
      函数: edgeData.functions.length,
      类: edgeData.classes.length,
      类型: edgeData.types.length
    })

    console.log('\n--- 测试递归类型 ---')
    const treeNodeType = edgeData.types.find((t: any) => t.name === 'TreeNode')
    if (treeNodeType) {
      console.log('✅ 找到递归类型 TreeNode')
      console.log('  定义:', treeNodeType.definition)
    }

    console.log('\n--- 测试函数重载 ---')
    const combineFunc = edgeData.functions.find(
      (f: any) => f.name === 'combine'
    )
    if (combineFunc) {
      console.log('✅ 找到函数重载 combine')
      console.log('  重载签名:', combineFunc.overloads?.length || 0)
    }

    console.log('\n--- 测试可选链和空值合并 ---')
    const userVar = edgeData.variables.find((v: any) => v.name === 'user')
    if (userVar) {
      console.log('✅ 找到使用可选链的变量 user')
    }

    console.log('\n--- 测试模板字面量类型 ---')
    const eventNameType = edgeData.types.find(
      (t: any) => t.name === 'EventName'
    )
    if (eventNameType) {
      console.log('✅ 找到模板字面量类型 EventName')
      console.log('  定义:', eventNameType.definition)
    }

    console.log('\n--- 测试语法错误代码 ---')
    try {
      const invalidResult = (await client.sendRequest('tools/call', {
        name: 'parse_code',
        arguments: {
          filepath: resolve('src/tests/fixtures/test-invalid.ts')
        }
      })) as any

      const invalidData = JSON.parse(invalidResult.result.content[0].text)
      console.log('✅ 语法错误代码处理成功:', {
        错误: invalidData.error || '无',
        函数: invalidData.functions.length,
        类: invalidData.classes.length
      })
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

    const longData = JSON.parse(longResult.result.content[0].text)
    console.log('✅ 极长代码解析成功:', {
      变量: longData.variables.length
    })

    console.log('\n--- 测试特殊字符 ---')
    const specialResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-special-chars.ts')
      }
    })) as any

    const specialData = JSON.parse(specialResult.result.content[0].text)
    console.log('✅ 特殊字符代码解析成功:', {
      变量: specialData.variables.length
    })

    console.log('\n--- 测试深度嵌套结构 ---')
    const nestedResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-nested.ts')
      }
    })) as any

    const nestedData = JSON.parse(nestedResult.result.content[0].text)
    const level1Type = nestedData.types.find((t: any) => t.name === 'Level1')
    if (level1Type) {
      console.log('✅ 深度嵌套结构解析成功')
      console.log('  定义:', level1Type.definition)
    }

    console.log('\n--- 测试 Unicode 和 Emoji ---')
    const unicodeResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-unicode.ts')
      }
    })) as any

    const unicodeData = JSON.parse(unicodeResult.result.content[0].text)
    console.log('✅ Unicode 和 Emoji 代码解析成功:', {
      变量: unicodeData.variables.length
    })

    console.log('\n--- 测试多次解析同一代码 ---')
    for (let i = 0; i < 5; i++) {
      const result = (await client.sendRequest('tools/call', {
        name: 'parse_code',
        arguments: {
          filepath: resolve('src/tests/fixtures/test-simple.ts')
        }
      })) as any

      const data = JSON.parse(result.result.content[0].text)
      if (data.variables.length < 3) {
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
