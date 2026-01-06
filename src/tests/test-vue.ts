import { MCPServerTestClient, vueCode } from './test-helper'

export async function testVue() {
  console.log('=== Vue 解析测试 ===\n')

  const client = new MCPServerTestClient()

  try {
    await client.initialize()

    console.log('--- 测试 Vue 文件解析 ---')
    const vueParseResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        code: vueCode,
        filename: 'test.vue'
      }
    })) as any

    const vueData = JSON.parse(vueParseResult.result.content[0].text)
    console.log('✅ Vue 文件解析成功:', {
      函数: vueData.functions.length,
      类型: vueData.types.length,
      导入: vueData.imports.length,
      模板: vueData.vueTemplate ? '有' : '无'
    })

    console.log('\n--- 测试 analyze_vue_template 工具 ---')
    const templateResult = (await client.sendRequest('tools/call', {
      name: 'analyze_vue_template',
      arguments: {
        code: vueCode,
        filename: 'test.vue'
      }
    })) as any

    const templateData = JSON.parse(templateResult.result.content[0].text)
    console.log('✅ 模板分析成功:', {
      指令: templateData.template?.directives?.length || 0,
      绑定: templateData.template?.bindings?.length || 0,
      事件: templateData.template?.events?.length || 0,
      组件: templateData.template?.components?.length || 0
    })

    if (templateData.template) {
      console.log(
        '\n  指令详情:',
        templateData.template.directives?.map((d: any) => d.name).join(', ') ||
          '无'
      )
      console.log(
        '  绑定详情:',
        templateData.template.bindings?.map((b: any) => b.name).join(', ') ||
          '无'
      )
      console.log(
        '  事件详情:',
        templateData.template.events?.map((e: any) => e.name).join(', ') || '无'
      )
      console.log(
        '  组件详情:',
        templateData.template.components?.map((c: any) => c.name).join(', ') ||
          '无'
      )
    }

    await client.shutdown()
    await client.close()

    console.log('\n✅ Vue 解析测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
