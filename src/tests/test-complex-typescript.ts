import {
  MCPServerTestClient,
  complexTypeScriptCode,
  largeCode
} from './test-helper'

export async function testComplexTypeScript() {
  console.log('=== 复杂 TypeScript 解析测试 ===\n')

  const client = new MCPServerTestClient()

  try {
    await client.initialize()

    console.log('--- 测试复杂代码解析 ---')
    const complexParseResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        code: complexTypeScriptCode,
        filename: 'complex.ts'
      }
    })) as any

    const complexData = JSON.parse(complexParseResult.result.content[0].text)
    console.log('✅ 复杂代码解析成功:', {
      函数: complexData.functions.length,
      类: complexData.classes.length,
      类型: complexData.types.length,
      导出: complexData.exports.length
    })

    console.log('\n--- 测试泛型类解析 ---')
    const classesResult = (await client.sendRequest('tools/call', {
      name: 'find_classes',
      arguments: {
        code: complexTypeScriptCode,
        filename: 'complex.ts'
      }
    })) as any
    const classesData = JSON.parse(classesResult.result.content[0].text)
    console.log(
      '✅ 找到类:',
      classesData.classes.map((c: any) => c.name).join(', ')
    )

    const repositoryClass = classesData.classes.find(
      (c: any) => c.name === 'Repository'
    )
    if (repositoryClass) {
      console.log('  Repository 类详情:', {
        泛型参数:
          repositoryClass.typeParameters?.map((p: any) => p.name).join(', ') ||
          '无',
        方法:
          repositoryClass.methods?.map((m: any) => m.name).join(', ') || '无'
      })
    }

    console.log('\n--- 测试装饰器解析 ---')
    const calculatorClass = classesData.classes.find(
      (c: any) => c.name === 'Calculator'
    )
    if (calculatorClass) {
      console.log(
        '✅ Calculator 类有装饰器:',
        calculatorClass.decorators?.length || 0
      )
      calculatorClass.methods?.forEach((method: any) => {
        if (method.decorators && method.decorators.length > 0) {
          console.log(
            `  方法 ${method.name} 的装饰器:`,
            method.decorators.map((d: any) => d.name).join(', ')
          )
        }
      })
    }

    console.log('\n--- 测试枚举解析 ---')
    const typesResult = (await client.sendRequest('tools/call', {
      name: 'find_types',
      arguments: {
        code: complexTypeScriptCode,
        filename: 'complex.ts'
      }
    })) as any
    const typesData = JSON.parse(typesResult.result.content[0].text)
    const enumTypes = typesData.types.filter((t: any) => t.kind === 'enum')
    console.log('✅ 找到枚举:', enumTypes.map((e: any) => e.name).join(', '))

    const userRoleEnum = enumTypes.find((e: any) => e.name === 'UserRole')
    if (userRoleEnum) {
      console.log(
        '  UserRole 枚举成员:',
        userRoleEnum.members?.map((m: any) => m.name).join(', ') || '无'
      )
    }

    console.log('\n--- 测试命名空间解析 ---')
    const namespaceTypes = typesData.types.filter(
      (t: any) => t.kind === 'namespace'
    )
    console.log(
      '✅ 找到命名空间:',
      namespaceTypes.map((n: any) => n.name).join(', ')
    )

    const utilsNamespace = namespaceTypes.find((n: any) => n.name === 'Utils')
    if (utilsNamespace) {
      console.log(
        '  Utils 命名空间导出:',
        utilsNamespace.exports?.map((e: any) => e.name).join(', ') || '无'
      )
    }

    console.log('\n--- 测试联合类型解析 ---')
    const unionTypes = typesData.types.filter(
      (t: any) =>
        t.kind === 'type' && t.definition && t.definition.includes('|')
    )
    console.log(
      '✅ 找到联合类型:',
      unionTypes.map((u: any) => u.name).join(', ')
    )

    console.log('\n--- 测试大型代码解析 ---')
    const largeParseResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        code: largeCode,
        filename: 'large.ts'
      }
    })) as any

    const largeData = JSON.parse(largeParseResult.result.content[0].text)
    console.log('✅ 大型代码解析成功:', {
      函数: largeData.functions.length,
      类: largeData.classes.length,
      类型: largeData.types.length,
      导出: largeData.exports.length
    })

    console.log('\n--- 测试多个类的方法解析 ---')
    const largeClassesResult = (await client.sendRequest('tools/call', {
      name: 'find_classes',
      arguments: {
        code: largeCode,
        filename: 'large.ts'
      }
    })) as any
    const largeClassesData = JSON.parse(
      largeClassesResult.result.content[0].text
    )
    console.log(`✅ 找到 ${largeClassesData.count} 个类`)
    largeClassesData.classes.forEach((cls: any) => {
      console.log(`  ${cls.name}: ${cls.methods?.length || 0} 个方法`)
    })

    console.log('\n--- 测试接口解析 ---')
    const interfaceTypes = largeData.types.filter(
      (t: any) => t.kind === 'interface'
    )
    console.log(`✅ 找到 ${interfaceTypes.length} 个接口`)
    interfaceTypes.forEach((iface: any) => {
      console.log(`  ${iface.name}: ${iface.properties?.length || 0} 个属性`)
    })

    console.log('\n--- 测试默认导出 ---')
    const exportsResult = (await client.sendRequest('tools/call', {
      name: 'find_exports',
      arguments: {
        code: complexTypeScriptCode,
        filename: 'complex.ts'
      }
    })) as any
    const exportsData = JSON.parse(exportsResult.result.content[0].text)
    const defaultExports = exportsData.exports.filter((e: any) => e.isDefault)
    console.log(
      '✅ 找到默认导出:',
      defaultExports.map((e: any) => e.name).join(', ') || '无'
    )

    console.log('\n--- 测试具名导出 ---')
    const namedExports = exportsData.exports.filter((e: any) => !e.isDefault)
    console.log(`✅ 找到 ${namedExports.length} 个具名导出`)
    console.log('  导出列表:', namedExports.map((e: any) => e.name).join(', '))

    await client.shutdown()
    await client.close()

    console.log('\n✅ 复杂 TypeScript 解析测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
