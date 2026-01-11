import type { Statement, ObjectExpression } from '@babel/types'
import {
  parse as parseSFCv3,
  compileScript as compileScriptV3
} from '@vue/compiler-sfc'
import {
  parseComponent as parseSFCv2,
  compileScript as compileScriptV2
} from '@vue/compiler-sfc-v2'
import type { VueParseResult } from './types'
import { getLogger } from '../../../utils/logger'
import { isVue2OptionsAPI } from './vueUtils'

// 导入解析器
import { extractImports } from './extractors/importExtractor'
import { extractMethods } from './extractors/methodExtractor'

const logger = getLogger()

/**
 * 验证输入参数的有效性
 * @param code Vue组件代码
 * @param filename 文件名
 */
function validateInput(code: string, filename: string): void {
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid code: code must be a non-empty string')
  }
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename: filename must be a non-empty string')
  }
}

/**
 * 检测是否是Vue Options API组件
 */
function isOptionsAPIComponent(ast: Statement[]): boolean {
  const exportDefaultNode = ast.find(
    node => node.type === 'ExportDefaultDeclaration'
  )

  if (!exportDefaultNode) return false

  let componentOptions: ObjectExpression | null = null

  // 检查是否是直接的对象表达式
  if (exportDefaultNode.declaration.type === 'ObjectExpression') {
    componentOptions = exportDefaultNode.declaration
  }

  // 检查是否是defineComponent调用
  else if (exportDefaultNode.declaration.type === 'CallExpression') {
    const callExpr = exportDefaultNode.declaration
    if (
      callExpr.callee.type === 'Identifier' &&
      callExpr.callee.name === 'defineComponent' &&
      callExpr.arguments.length > 0 &&
      callExpr.arguments[0].type === 'ObjectExpression'
    ) {
      componentOptions = callExpr.arguments[0]
    }
  }

  // 如果找到了组件配置对象，检查是否包含Options API的特征
  if (componentOptions) {
    // 检查是否有methods、computed、watch等Options API属性
    // 注意：如果有setup函数，即使有其他Options API属性，也应该被视为Composition API
    const hasSetup = componentOptions.properties.some(prop => {
      if (prop.type !== 'ObjectProperty' && prop.type !== 'ObjectMethod')
        return false
      if (!('key' in prop) || prop.key.type !== 'Identifier') return false
      return prop.key.name === 'setup'
    })

    // 如果有setup函数，不是Options API
    if (hasSetup) return false

    // 检查是否有Options API的典型属性
    const hasOptionsAPIProps = componentOptions.properties.some(prop => {
      if (prop.type !== 'ObjectProperty' && prop.type !== 'ObjectMethod')
        return false
      if (!('key' in prop) || prop.key.type !== 'Identifier') return false
      const keyName = prop.key.name
      return [
        'data',
        'methods',
        'computed',
        'watch',
        'created',
        'mounted'
      ].includes(keyName)
    })

    return hasOptionsAPIProps
  }

  return false
}

/**
 * 检测是否是Vue Composition API组件（包含setup函数）
 */
function hasSetupFunction(ast: Statement[]): boolean {
  const exportDefaultNode = ast.find(
    node => node.type === 'ExportDefaultDeclaration'
  )

  if (
    !exportDefaultNode ||
    exportDefaultNode.declaration.type !== 'ObjectExpression'
  ) {
    return false
  }

  const objExpr = exportDefaultNode.declaration
  return objExpr.properties.some(prop => {
    // 确保只有ObjectProperty和ObjectMethod类型的属性才有key
    if (prop.type !== 'ObjectProperty' && prop.type !== 'ObjectMethod')
      return false

    // 确保prop.key存在且是Identifier类型
    if (!prop.key || prop.key.type !== 'Identifier') return false

    return prop.key.name === 'setup'
  })
}

function parseVue2Component(code: string, filename: string): VueParseResult {
  validateInput(code, filename)
  logger.debug(`Parsing Vue 2 component: ${filename}`)

  try {
    const startTime = performance.now()
    // 使用Vue 2的parseComponent函数解析SFC
    const descriptor = parseSFCv2(code, {})

    // 使用compileScript编译
    const compiledScript = compileScriptV2(descriptor, {
      id: filename,
      sourceMap: false
    })

    const ast: Statement[] | undefined =
      compiledScript.scriptSetupAst || compiledScript.scriptAst

    if (ast) {
      // 提取各个部分的信息
      const imports = extractImports(ast)
      const methods = extractMethods(ast)
      const parseTime = performance.now() - startTime
      logger.debug(
        `Parsed Vue 2 component ${filename} in ${parseTime.toFixed(2)}ms`,
        {
          imports: imports.length,
          methods: methods.length
        }
      )

      // 检测是否是Vue 2.7 Composition API组件（包含setup函数）
      const isCompositionAPI = Array.isArray(ast) && hasSetupFunction(ast)

      // 返回解析结果
      const result: VueParseResult = {
        language: 'vue'
      }

      if (isCompositionAPI) {
        // Vue 2.7 Composition API组件
        result.compositionAPI = {
          methods // 已实现
        }
      } else {
        // Vue 2 Options API组件
        result.optionsAPI = {
          methods // 已实现
        }
      }

      // 只有当有导入时才包含imports字段
      if (imports.length > 0) {
        result.imports = imports
      }

      return result
    }
  } catch (error) {
    logger.error(
      `Failed to parse Vue 2 component ${filename}:`,
      error instanceof Error ? error : String(error)
    )
    throw error
  }

  // 返回空的解析结果（理论上不会执行到这里，因为错误已经被抛出）
  return {
    language: 'vue',
    optionsAPI: {}
  }
}

function parseVue3Component(code: string, filename: string): VueParseResult {
  validateInput(code, filename)
  logger.debug(`Parsing Vue 3 component: ${filename}`)

  try {
    const startTime = performance.now()
    // 使用Vue 3的parse函数解析SFC
    const { descriptor } = parseSFCv3(code, { filename })

    // 使用compileScript编译
    const compiledScript = compileScriptV3(descriptor, {
      id: filename,
      sourceMap: false
    })

    const ast = compiledScript.scriptSetupAst || compiledScript.scriptAst

    if (ast) {
      // 提取各个部分的信息
      const imports = extractImports(ast)
      const methods = extractMethods(ast)
      const duration = performance.now() - startTime
      logger.debug(
        `Parsed Vue 3 component ${filename} in ${duration.toFixed(2)}ms`,
        {
          imports: imports.length,
          methods: methods.length
        }
      )

      // 检测是否是Vue 3 Options API组件
      const isOptionsAPI = Array.isArray(ast) && isOptionsAPIComponent(ast)

      // 返回解析结果
      const result: VueParseResult = {
        language: 'vue'
      }

      if (isOptionsAPI) {
        // Vue 3 Options API组件
        result.optionsAPI = {
          methods // 已实现
        }
      } else {
        // Vue 3 Composition API组件
        result.compositionAPI = {
          methods // 已实现
        }
      }

      // 只有当有导入时才包含imports字段
      if (imports.length > 0) {
        result.imports = imports
      }

      return result
    } else {
      // 无法提取AST，返回默认结构
      logger.debug(`No AST found for Vue 3 component: ${filename}`)
      return {
        language: 'vue',
        compositionAPI: {}
      }
    }
  } catch (error) {
    logger.error(
      `Failed to parse Vue 3 component ${filename}:`,
      error instanceof Error ? error : String(error)
    )
    throw error
  }
}

export function parseVue(code: string, filename: string): VueParseResult {
  validateInput(code, filename)
  logger.debug(`Parsing Vue component: ${filename}`)

  try {
    const isVue2 = isVue2OptionsAPI(code)
    logger.debug(`File ${filename} is Vue 2 component: ${isVue2}`)

    if (isVue2) {
      return parseVue2Component(code, filename)
    } else {
      return parseVue3Component(code, filename)
    }
  } catch (error) {
    logger.error(
      `Failed to parse Vue component ${filename}:`,
      error instanceof Error ? error : String(error)
    )
    throw error
  }
}
