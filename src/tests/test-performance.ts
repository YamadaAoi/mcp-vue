import { MCPServerTestClient, testCode, largeCode } from './test-helper'

export async function testPerformance() {
  console.log('=== 性能测试 ===\n')

  const client = new MCPServerTestClient()

  try {
    await client.initialize()

    console.log('--- 测试单次解析性能 ---')
    const singleStartTime = Date.now()
    const singleResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        code: testCode,
        filename: 'test.ts'
      }
    })) as any
    const singleEndTime = Date.now()

    JSON.parse(singleResult.result.content[0].text)
    console.log(`✅ 单次解析耗时: ${singleEndTime - singleStartTime}ms`)

    console.log('\n--- 测试多次解析性能 ---')
    const iterations = 10
    const multiStartTime = Date.now()

    for (let i = 0; i < iterations; i++) {
      const result = (await client.sendRequest('tools/call', {
        name: 'parse_code',
        arguments: {
          code: testCode,
          filename: `test${i}.ts`
        }
      })) as any
      JSON.parse(result.result.content[0].text)
    }

    const multiEndTime = Date.now()
    const avgTime = (multiEndTime - multiStartTime) / iterations
    console.log(
      `✅ ${iterations} 次解析总耗时: ${multiEndTime - multiStartTime}ms`
    )
    console.log(`✅ 平均每次解析耗时: ${avgTime.toFixed(2)}ms`)

    console.log('\n--- 测试大型文件解析性能 ---')
    const largeStartTime = Date.now()
    const largeResult = (await client.sendRequest('tools/call', {
      name: 'parse_code',
      arguments: {
        code: largeCode,
        filename: 'large.ts'
      }
    })) as any
    const largeEndTime = Date.now()

    const largeData = JSON.parse(largeResult.result.content[0].text)
    console.log(`✅ 大型文件解析耗时: ${largeEndTime - largeStartTime}ms`)
    console.log(
      `  解析结果: ${largeData.functions.length} 函数, ${largeData.classes.length} 类`
    )

    console.log('\n--- 测试并发解析性能 ---')
    const concurrentCount = 5
    const concurrentStartTime = Date.now()

    const concurrentRequests = Array.from({ length: concurrentCount }, (_, i) =>
      client.sendRequest('tools/call', {
        name: 'parse_code',
        arguments: {
          code: testCode,
          filename: `concurrent${i}.ts`
        }
      })
    )

    const concurrentResults = await Promise.all(concurrentRequests)
    const concurrentEndTime = Date.now()

    concurrentResults.forEach((result: any) => {
      JSON.parse(result.result.content[0].text)
    })

    console.log(
      `✅ ${concurrentCount} 个并发请求总耗时: ${concurrentEndTime - concurrentStartTime}ms`
    )
    console.log(
      `✅ 平均每个请求耗时: ${((concurrentEndTime - concurrentStartTime) / concurrentCount).toFixed(2)}ms`
    )

    console.log('\n--- 测试不同工具的性能 ---')
    const tools = [
      'parse_code',
      'find_functions',
      'find_classes',
      'find_types',
      'find_exports'
    ]
    const toolTimes: Record<string, number> = {}

    for (const tool of tools) {
      const toolStartTime = Date.now()
      const result = (await client.sendRequest('tools/call', {
        name: tool,
        arguments: {
          code: testCode,
          filename: 'test.ts'
        }
      })) as any
      const toolEndTime = Date.now()

      JSON.parse(result.result.content[0].text)
      toolTimes[tool] = toolEndTime - toolStartTime
    }

    console.log('✅ 各工具性能:')
    Object.entries(toolTimes).forEach(([tool, time]) => {
      console.log(`  ${tool}: ${time}ms`)
    })

    console.log('\n--- 测试缓存性能 ---')
    const cacheKey = 'cache-test.ts'
    const cacheIterations = 5

    const cacheStartTime = Date.now()
    for (let i = 0; i < cacheIterations; i++) {
      const result = (await client.sendRequest('tools/call', {
        name: 'parse_code',
        arguments: {
          code: testCode,
          filename: cacheKey
        }
      })) as any
      JSON.parse(result.result.content[0].text)
    }
    const cacheEndTime = Date.now()

    console.log(
      `✅ ${cacheIterations} 次缓存解析总耗时: ${cacheEndTime - cacheStartTime}ms`
    )
    console.log(
      `✅ 平均每次缓存解析耗时: ${((cacheEndTime - cacheStartTime) / cacheIterations).toFixed(2)}ms`
    )

    console.log('\n--- 测试内存使用 ---')
    const memoryBefore = process.memoryUsage()
    const memoryIterations = 20

    for (let i = 0; i < memoryIterations; i++) {
      const result = (await client.sendRequest('tools/call', {
        name: 'parse_code',
        arguments: {
          code: testCode,
          filename: `memory${i}.ts`
        }
      })) as any
      JSON.parse(result.result.content[0].text)
    }

    const memoryAfter = process.memoryUsage()
    const memoryDiff = {
      rss: memoryAfter.rss - memoryBefore.rss,
      heapTotal: memoryAfter.heapTotal - memoryBefore.heapTotal,
      heapUsed: memoryAfter.heapUsed - memoryBefore.heapUsed
    }

    console.log(`✅ ${memoryIterations} 次解析后内存变化:`)
    console.log(`  RSS: ${(memoryDiff.rss / 1024 / 1024).toFixed(2)}MB`)
    console.log(
      `  Heap Total: ${(memoryDiff.heapTotal / 1024 / 1024).toFixed(2)}MB`
    )
    console.log(
      `  Heap Used: ${(memoryDiff.heapUsed / 1024 / 1024).toFixed(2)}MB`
    )

    console.log('\n--- 测试响应时间稳定性 ---')
    const stabilityIterations = 10
    const responseTimes: number[] = []

    for (let i = 0; i < stabilityIterations; i++) {
      const startTime = Date.now()
      const result = (await client.sendRequest('tools/call', {
        name: 'parse_code',
        arguments: {
          code: testCode,
          filename: `stability${i}.ts`
        }
      })) as any
      const endTime = Date.now()

      JSON.parse(result.result.content[0].text)
      responseTimes.push(endTime - startTime)
    }

    const avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    const minResponseTime = Math.min(...responseTimes)
    const maxResponseTime = Math.max(...responseTimes)
    const stdDev = Math.sqrt(
      responseTimes.reduce(
        (sum, time) => sum + Math.pow(time - avgResponseTime, 2),
        0
      ) / responseTimes.length
    )

    console.log(`✅ ${stabilityIterations} 次响应时间统计:`)
    console.log(`  平均: ${avgResponseTime.toFixed(2)}ms`)
    console.log(`  最小: ${minResponseTime}ms`)
    console.log(`  最大: ${maxResponseTime}ms`)
    console.log(`  标准差: ${stdDev.toFixed(2)}ms`)

    console.log('\n--- 性能基准 ---')
    const benchmarks = {
      单次解析: singleEndTime - singleStartTime,
      平均解析: avgTime,
      大型文件: largeEndTime - largeStartTime,
      并发请求: (concurrentEndTime - concurrentStartTime) / concurrentCount
    }

    console.log('✅ 性能基准:')
    Object.entries(benchmarks).forEach(([name, time]) => {
      const status = time < 100 ? '优秀' : time < 500 ? '良好' : '一般'
      console.log(`  ${name}: ${time.toFixed(2)}ms (${status})`)
    })

    await client.shutdown()
    await client.close()

    console.log('\n✅ 性能测试通过\n')
  } catch (error) {
    await client.close()
    throw error
  }
}
