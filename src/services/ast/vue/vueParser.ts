import type { Statement } from '@babel/types'
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
import {
  isVue2OptionsAPI,
  validateInput,
  isOptionsAPIComponent,
  hasSetupFunction
} from './vueUtils'

import { extractImports } from './extractors/importExtractor'
import { extractMethods } from './extractors/methodExtractor'
import { extractProps } from './extractors/propExtractor'
import { extractEmits } from './extractors/emitExtractor'
import { extractLifecycleHooks } from './extractors/lifecycleExtractor'
import {
  extractVariables,
  extractDataProperties,
  extractRefs,
  extractReactive
} from './extractors/variableExtractor'

const logger = getLogger()

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
      const imports = extractImports(ast)
      const methods = extractMethods(ast)
      const props = extractProps(ast)
      const emits = extractEmits(ast)
      const lifecycleHooks = extractLifecycleHooks(ast)
      const variables = extractVariables(ast)
      const dataProperties = extractDataProperties(ast)
      const refs = extractRefs(ast)
      const reactives = extractReactive(ast)
      const parseTime = performance.now() - startTime
      logger.debug(
        `Parsed Vue 2 component ${filename} in ${parseTime.toFixed(2)}ms`,
        {
          imports: imports.length,
          methods: methods.length,
          props: props.length,
          emits: emits.length,
          lifecycleHooks: lifecycleHooks.length,
          variables: variables.length,
          dataProperties: dataProperties.length
        }
      )

      const isCompositionAPI = Array.isArray(ast) && hasSetupFunction(ast)

      const result: VueParseResult = {
        language: 'vue'
      }

      if (isCompositionAPI) {
        const compositionData: {
          methods: typeof methods
          props: typeof props
          emits?: typeof emits
          lifecycleHooks?: typeof lifecycleHooks
          variables?: typeof variables
          refs: typeof refs
          reactives: typeof reactives
        } = {
          methods,
          props,
          refs,
          reactives
        }
        if (emits.length > 0) {
          compositionData.emits = emits
        }
        if (lifecycleHooks.length > 0) {
          compositionData.lifecycleHooks = lifecycleHooks
        }
        if (variables.length > 0) {
          compositionData.variables = variables
        }
        result.compositionAPI = compositionData
      } else {
        const optionsData: {
          methods: typeof methods
          props: typeof props
          emits?: typeof emits
          lifecycleHooks?: typeof lifecycleHooks
          dataProperties?: typeof dataProperties
        } = {
          methods,
          props
        }
        if (emits.length > 0) {
          optionsData.emits = emits
        }
        if (lifecycleHooks.length > 0) {
          optionsData.lifecycleHooks = lifecycleHooks
        }
        if (dataProperties.length > 0) {
          optionsData.dataProperties = dataProperties
        }
        result.optionsAPI = optionsData
      }

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
      const imports = extractImports(ast)
      const methods = extractMethods(ast)
      const props = extractProps(ast)
      const emits = extractEmits(ast)
      const lifecycleHooks = extractLifecycleHooks(ast)
      const variables = extractVariables(ast)
      const dataProperties = extractDataProperties(ast)
      const refs = extractRefs(ast)
      const reactives = extractReactive(ast)
      const duration = performance.now() - startTime
      logger.debug(
        `Parsed Vue 3 component ${filename} in ${duration.toFixed(2)}ms`,
        {
          imports: imports.length,
          methods: methods.length,
          props: props.length,
          emits: emits.length,
          lifecycleHooks: lifecycleHooks.length,
          variables: variables.length,
          dataProperties: dataProperties.length
        }
      )

      const isOptionsAPI = Array.isArray(ast) && isOptionsAPIComponent(ast)

      const result: VueParseResult = {
        language: 'vue'
      }

      if (isOptionsAPI) {
        const optionsData: {
          methods: typeof methods
          props: typeof props
          emits?: typeof emits
          lifecycleHooks?: typeof lifecycleHooks
          dataProperties?: typeof dataProperties
        } = {
          methods,
          props
        }
        if (emits.length > 0) {
          optionsData.emits = emits
        }
        if (lifecycleHooks.length > 0) {
          optionsData.lifecycleHooks = lifecycleHooks
        }
        if (dataProperties.length > 0) {
          optionsData.dataProperties = dataProperties
        }
        result.optionsAPI = optionsData
      } else {
        const compositionData: {
          methods: typeof methods
          props: typeof props
          emits?: typeof emits
          lifecycleHooks?: typeof lifecycleHooks
          variables?: typeof variables
          refs?: typeof refs
          reactives?: typeof reactives
        } = {
          methods,
          props
        }
        if (emits.length > 0) {
          compositionData.emits = emits
        }
        if (lifecycleHooks.length > 0) {
          compositionData.lifecycleHooks = lifecycleHooks
        }
        if (variables.length > 0) {
          compositionData.variables = variables
        }
        if (refs.length > 0) {
          compositionData.refs = refs
        }
        if (reactives.length > 0) {
          compositionData.reactives = reactives
        }
        result.compositionAPI = compositionData
      }

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
