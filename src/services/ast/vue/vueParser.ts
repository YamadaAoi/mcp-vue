import { parse as parseSFC } from '@vue/compiler-sfc'
import type { ParseResult, VueOptionsAPIInfo } from '../types'
import { parseTypeScript } from '../typescript/tsParser'
import { getLogger } from '../../../utils/logger'
import { extractVueOptionsAPI } from '../extractors/vueOptionsExtractor'

const logger = getLogger()

function validateInput(code: string, filename: string): void {
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid code: code must be a non-empty string')
  }

  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename: filename must be a non-empty string')
  }
}

export async function parseVue(
  code: string,
  filename: string
): Promise<ParseResult> {
  validateInput(code, filename)

  logger.debug(`Parsing Vue file: ${filename}`)

  const { descriptor, errors } = parseSFC(code, { filename })

  if (errors.length > 0) {
    logger.warn('Vue SFC parsing errors:', errors)
  }

  let scriptResult: ParseResult | null = null
  let vueOptionsAPIInfo: VueOptionsAPIInfo | undefined

  if (descriptor.script || descriptor.scriptSetup) {
    const scriptContent =
      descriptor.script?.content || descriptor.scriptSetup?.content || ''

    try {
      logger.debug(`Parsing script section of ${filename}`)
      scriptResult = await parseTypeScript(
        scriptContent,
        filename,
        'typescript'
      )
      logger.debug(`Successfully parsed script section of ${filename}`)
    } catch (error) {
      logger.error(`Failed to parse script in ${filename}:`, error)
    }
  }

  if (scriptResult?.ast) {
    try {
      vueOptionsAPIInfo = extractVueOptionsAPI(scriptResult.ast)
      logger.debug(`Extracted Vue Options API info from ${filename}`, {
        dataProperties: vueOptionsAPIInfo.dataProperties.length,
        computedProperties: vueOptionsAPIInfo.computedProperties.length,
        watchProperties: vueOptionsAPIInfo.watchProperties.length,
        methods: vueOptionsAPIInfo.methods.length,
        lifecycleHooks: vueOptionsAPIInfo.lifecycleHooks.length
      })
    } catch (error) {
      logger.error(`Failed to extract Vue Options API from ${filename}:`, error)
    }
  }

  const result = {
    language: 'vue',
    ast: scriptResult?.ast || {
      type: 'root',
      text: '',
      startPosition: { row: 0, column: 0 },
      endPosition: { row: 0, column: 0 },
      children: []
    },
    functions: scriptResult?.functions || [],
    functionCalls: scriptResult?.functionCalls || [],
    classes: scriptResult?.classes || [],
    variables: scriptResult?.variables || [],
    imports: scriptResult?.imports || [],
    exports: scriptResult?.exports || [],
    types: scriptResult?.types || [],
    vueOptionsAPI: vueOptionsAPIInfo
  }

  logger.debug(`Successfully parsed Vue file: ${filename}`, {
    hasScript: !!scriptResult
  })

  return result
}
