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

    const basicData = JSON.parse(basicVueResult.result.content[0].text)
    console.log('✅ 基础 Vue 文件解析成功:', {
      函数: basicData.functions.length,
      类型: basicData.types.length,
      导入: basicData.imports.length,
      模板: basicData.vueTemplate ? '有' : '无'
    })

    console.log('\n--- 测试复杂 Vue 文件解析 ---')
    const complexVueResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        filepath: resolve('src/tests/fixtures/test-complex-vue.vue')
      }
    })) as any

    const complexData = JSON.parse(complexVueResult.result.content[0].text)
    console.log('✅ 复杂 Vue 文件解析成功:', {
      函数: complexData.functions.length,
      类型: complexData.types.length,
      导入: complexData.imports.length,
      变量: complexData.variables.length,
      模板: complexData.vueTemplate ? '有' : '无'
    })

    if (complexData.vueTemplate) {
      console.log('\n--- 验证模板信息 ---')
      console.log('指令:', complexData.vueTemplate.directives?.length || 0)
      console.log('绑定:', complexData.vueTemplate.bindings?.length || 0)
      console.log('事件:', complexData.vueTemplate.events?.length || 0)
      console.log('组件:', complexData.vueTemplate.components?.length || 0)

      if (complexData.vueTemplate.directives?.length > 0) {
        console.log('\n  指令详情:')
        complexData.vueTemplate.directives.forEach((d: any) => {
          console.log(`    ${d.name}: ${d.value || '无值'}`)
        })
      }

      if (complexData.vueTemplate.bindings?.length > 0) {
        console.log('\n  绑定详情:')
        complexData.vueTemplate.bindings.forEach((b: any) => {
          console.log(`    ${b.name}: ${b.value}`)
        })
      }

      if (complexData.vueTemplate.events?.length > 0) {
        console.log('\n  事件详情:')
        complexData.vueTemplate.events.forEach((e: any) => {
          console.log(`    ${e.name}: ${e.handler}`)
        })
      }

      if (complexData.vueTemplate.components?.length > 0) {
        console.log('\n  组件详情:')
        complexData.vueTemplate.components.forEach((c: any) => {
          console.log(`    ${c.name}`)
        })
      }

      console.log('\n--- 测试 v-if/v-else-if/v-else 指令 ---')
      const vIfDirectives = complexData.vueTemplate.directives?.filter(
        (d: any) => ['v-if', 'v-else-if', 'v-else'].includes(d.name)
      )
      console.log(`✅ 找到 ${vIfDirectives?.length || 0} 个条件渲染指令`)

      console.log('\n--- 测试 v-for 指令 ---')
      const vForDirectives = complexData.vueTemplate.directives?.filter(
        (d: any) => d.name === 'v-for'
      )
      console.log(`✅ 找到 ${vForDirectives?.length || 0} 个 v-for 指令`)
      vForDirectives?.forEach((d: any) => {
        console.log(`    ${d.value}`)
      })
    }

    console.log('\n--- 测试 script setup 部分解析 ---')
    console.log(
      '✅ 找到函数:',
      complexData.functions.map((f: any) => f.name).join(', ')
    )

    const fetchUsersFunc = complexData.functions.find(
      (f: any) => f.name === 'fetchUsers'
    )
    if (fetchUsersFunc) {
      console.log('  fetchUsers 函数详情:', {
        异步: fetchUsersFunc.isAsync,
        参数:
          fetchUsersFunc.parameters?.map((p: any) => p.name).join(', ') || '无'
      })
    }

    console.log('\n--- 测试响应式变量解析 ---')
    console.log(`✅ 找到 ${complexData.variables.length} 个变量`)

    console.log('\n--- 测试类型解析 ---')
    console.log(`✅ 找到 ${complexData.types.length} 个类型`)
    console.log(
      '  类型列表:',
      complexData.types.map((t: any) => t.name).join(', ')
    )

    console.log('\n--- 测试导入解析 ---')
    console.log(`✅ 找到 ${complexData.imports.length} 个导入`)
    complexData.imports.forEach((imp: any) => {
      console.log(
        `    ${imp.source}: ${imp.imports?.map((s: any) => s.name).join(', ') || '默认导入'}`
      )
    })

    console.log('\n--- 测试 computed 属性 ---')
    const computedVars = complexData.variables.filter((v: any) => v.isComputed)
    console.log(`✅ 找到 ${computedVars.length} 个计算属性`)
    computedVars.forEach((v: any) => {
      console.log(`    ${v.name}`)
    })

    console.log('\n--- 测试生命周期钩子 ---')
    const lifecycleHooks = [
      'onMounted',
      'onUpdated',
      'onUnmounted',
      'onBeforeMount'
    ]
    const foundHooks = complexData.functions.filter((f: any) =>
      lifecycleHooks.some(hook => f.name.includes(hook))
    )
    console.log(`✅ 找到 ${foundHooks.length} 个生命周期钩子`)
    foundHooks.forEach((hook: any) => {
      console.log(`    ${hook.name}`)
    })

    console.log('\n--- 测试 style 部分 ---')
    if (complexData.vueStyle) {
      console.log('✅ 找到 style 部分')
      console.log(`  作用域: ${complexData.vueStyle.scoped ? '是' : '否'}`)
    }

    await client.shutdown()
    await client.close()

    console.log('\n✅ 复杂 Vue 解析测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
