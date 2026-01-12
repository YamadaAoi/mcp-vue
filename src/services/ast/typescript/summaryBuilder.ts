import type { TsParseResult } from './types'
import { getLogger } from '../../../utils/logger'
import {
  formatPosition,
  formatParameters,
  formatVariableValue,
  formatImport
} from '../../../utils/formatters'
import {
  type SummaryOptions,
  DEFAULT_SUMMARY_OPTIONS
} from '../../../utils/summaryConfig'

const logger = getLogger()

function formatExport(exp: TsParseResult['exports'][0]): string {
  const parts: string[] = []

  if (exp.isDefault) {
    parts.push('default')
  }

  parts.push(exp.name)
  parts.push(`(${exp.type})`)
  return parts.join(' ')
}

function buildFunctionsSection(
  functions: TsParseResult['functions'],
  options: SummaryOptions
): string[] {
  if (!functions || functions.length === 0) return []

  const lines: string[] = []
  lines.push(`## Functions (${functions.length})`)
  lines.push('')

  for (const fn of functions) {
    const params = formatParameters(fn.parameters)
    const pos = options.showPositions ? formatPosition(fn.startPosition) : ''
    const typeInfo =
      options.showTypes && fn.type !== 'function' ? ` [${fn.type}]` : ''
    lines.push(
      `- ${fn.name}(${params}) -> ${fn.returnType || 'void'}${typeInfo}${pos}`
    )
  }

  lines.push('')
  return lines
}

function buildFunctionCallsSection(
  functionCalls: TsParseResult['functionCalls'],
  options: SummaryOptions
): string[] {
  if (!functionCalls || functionCalls.length === 0) return []

  const lines: string[] = []
  lines.push(`## Function Calls (${functionCalls.length})`)
  lines.push('')

  for (const call of functionCalls) {
    const pos = options.showPositions ? formatPosition(call.startPosition) : ''
    const args =
      call.arguments && call.arguments.length > 0
        ? call.arguments.join(', ')
        : 'none'
    lines.push(`- ${call.name}(${args})${pos}`)
  }

  lines.push('')
  return lines
}

function buildClassesSection(
  classes: TsParseResult['classes'],
  options: SummaryOptions
): string[] {
  if (!classes || classes.length === 0) return []

  const lines: string[] = []
  lines.push(`## Classes (${classes.length})`)
  lines.push('')

  for (const cls of classes) {
    const pos = options.showPositions ? formatPosition(cls.startPosition) : ''
    const extendsClause = cls.extends ? ` extends ${cls.extends}` : ''
    const implementsClause =
      cls.implements && cls.implements.length > 0
        ? ` implements ${cls.implements.join(', ')}`
        : ''

    lines.push(`- ${cls.name}${extendsClause}${implementsClause}${pos}`)

    if (cls.properties && cls.properties.length > 0) {
      lines.push('  Properties:')
      for (const prop of cls.properties) {
        const visibility = prop.visibility ? `${prop.visibility} ` : ''
        const readonly = prop.isReadonly ? 'readonly ' : ''
        const typeInfo = options.showTypes && prop.type ? `: ${prop.type}` : ''
        lines.push(`  - ${visibility}${readonly}${prop.name}${typeInfo}`)
      }
    }

    if (cls.methods && cls.methods.length > 0) {
      lines.push('  Methods:')
      for (const method of cls.methods) {
        const params = formatParameters(method.parameters)
        const returnType = options.showTypes
          ? ` -> ${method.returnType || 'void'}`
          : ''
        lines.push(`  - ${method.name}(${params})${returnType}`)
      }
    }
  }

  lines.push('')
  return lines
}

function buildVariablesSection(
  variables: TsParseResult['variables'],
  options: SummaryOptions
): string[] {
  if (!variables || variables.length === 0) return []

  const lines: string[] = []
  lines.push(`## Variables (${variables.length})`)
  lines.push('')

  for (const v of variables) {
    const pos = options.showPositions ? formatPosition(v.startPosition) : ''
    const constKeyword = v.isConst ? 'const' : 'let'
    const value = options.compact ? '' : ` = ${formatVariableValue(v.value)}`
    const typeInfo = options.showTypes && v.type ? `: ${v.type}` : ''
    lines.push(`- ${constKeyword} ${v.name}${typeInfo}${value}${pos}`)
  }

  lines.push('')
  return lines
}

function buildImportsSection(
  imports: TsParseResult['imports'],
  options: SummaryOptions
): string[] {
  if (!imports || imports.length === 0) return []

  const lines: string[] = []
  lines.push(`## Imports (${imports.length})`)
  lines.push('')

  for (const imp of imports) {
    const pos = options.showPositions ? formatPosition(imp.startPosition) : ''
    const importStr = formatImport(
      imp.imports,
      imp.source,
      imp.isDefault,
      imp.isNamespace
    )
    lines.push(`- ${importStr}${pos}`)
  }

  lines.push('')
  return lines
}

function buildExportsSection(
  exports: TsParseResult['exports'],
  options: SummaryOptions
): string[] {
  if (!exports || exports.length === 0) return []

  const lines: string[] = []
  lines.push(`## Exports (${exports.length})`)
  lines.push('')

  for (const exp of exports) {
    const pos = options.showPositions ? formatPosition(exp.startPosition) : ''
    const exportStr = formatExport(exp)
    lines.push(`- ${exportStr}${pos}`)
  }

  lines.push('')
  return lines
}

function buildTypesSection(
  types: TsParseResult['types'],
  options: SummaryOptions
): string[] {
  if (!types || types.length === 0) return []

  const lines: string[] = []
  lines.push(`## Types (${types.length})`)
  lines.push('')

  for (const t of types) {
    const pos = options.showPositions ? formatPosition(t.startPosition) : ''
    lines.push(`- ${t.name} (${t.kind})${pos}`)

    if (t.properties && t.properties.length > 0) {
      lines.push('  Properties:')
      for (const prop of t.properties) {
        const optional = prop.isOptional ? '?' : ''
        const readonly = prop.isReadonly ? 'readonly ' : ''
        const typeInfo = options.showTypes ? `: ${prop.type || 'any'}` : ''
        lines.push(`  - ${readonly}${prop.name}${optional}${typeInfo}`)
      }
    }

    if (t.methods && t.methods.length > 0) {
      lines.push('  Methods:')
      for (const method of t.methods) {
        const params = formatParameters(method.parameters)
        const returnType = options.showTypes
          ? ` -> ${method.returnType || 'void'}`
          : ''
        lines.push(`  - ${method.name}(${params})${returnType}`)
      }
    }
  }

  lines.push('')
  return lines
}

export function buildSummary(
  result: TsParseResult,
  filepath: string,
  options: SummaryOptions = {}
): string {
  const opts = { ...DEFAULT_SUMMARY_OPTIONS, ...options }
  const lines: string[] = []

  lines.push(`# Code Analysis: ${filepath}`)
  lines.push('')
  lines.push(`Language: ${result.language}`)
  lines.push('')

  lines.push(...buildFunctionsSection(result.functions, opts))
  lines.push(...buildFunctionCallsSection(result.functionCalls, opts))
  lines.push(...buildClassesSection(result.classes, opts))
  lines.push(...buildVariablesSection(result.variables, opts))
  lines.push(...buildImportsSection(result.imports, opts))
  lines.push(...buildExportsSection(result.exports, opts))
  lines.push(...buildTypesSection(result.types, opts))

  const summary = lines.join('\n')

  logger.debug(
    `=== Summary for ${filepath} ===\n${summary}\n=== End of Summary ===`
  )

  return summary
}
