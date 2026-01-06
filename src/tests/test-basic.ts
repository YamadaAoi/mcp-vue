import { MCPServerTestClient } from './test-helper'

export async function testBasic() {
  console.log('=== 基础功能测试 ===\n')

  const client = new MCPServerTestClient()

  try {
    await client.initialize()

    const toolsList = (await client.sendRequest('tools/list')) as any
    console.log('✅ 可用工具数量:', toolsList.result.tools.length)

    const toolNames = toolsList.result.tools.map((t: any) => t.name)
    console.log('✅ 工具列表:', toolNames.join(', '))

    await client.shutdown()
    await client.close()

    console.log('✅ 基础功能测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
