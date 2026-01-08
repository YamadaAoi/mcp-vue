import type { MappedParseResult } from './types'
import { getLogger } from '../../utils/logger'

const logger = getLogger()

function formatPosition(position: { row: number; column: number }): string {
  return `[L${position.row}:C${position.column}]`
}

function formatParameters(parameters: string[]): string {
  return parameters.length > 0 ? parameters.join(', ') : 'none'
}

function formatVariableValue(value: string): string {
  if (!value) return 'undefined'
  if (value.length > 50) {
    return value.substring(0, 50) + '...'
  }
  return value
}

function formatImport(imp: MappedParseResult['imports'][0]): string {
  const parts: string[] = []

  if (imp.isDefault) {
    parts.push(`default ${imp.imports[0]}`)
  } else if (imp.isNamespace) {
    parts.push(`* as ${imp.imports[0]}`)
  } else {
    parts.push(imp.imports.join(', '))
  }

  parts.push(`from ${imp.source}`)
  return parts.join(' ')
}

function formatExport(exp: MappedParseResult['exports'][0]): string {
  const parts: string[] = []

  if (exp.isDefault) {
    parts.push('default')
  }

  parts.push(exp.name)
  parts.push(`(${exp.type})`)
  return parts.join(' ')
}

function buildFunctionsSection(
  functions: MappedParseResult['functions']
): string[] {
  if (functions.length === 0) return []

  const lines: string[] = []
  lines.push(`## Functions (${functions.length})`)
  lines.push('')

  for (const fn of functions) {
    const params = formatParameters(fn.parameters)
    const pos = formatPosition(fn.position.start)
    const typeInfo = fn.type !== 'function' ? ` [${fn.type}]` : ''
    lines.push(
      `- ${fn.name}(${params}) -> ${fn.returnType || 'void'}${typeInfo}${pos}`
    )
  }

  lines.push('')
  return lines
}

function buildFunctionCallsSection(
  functionCalls: MappedParseResult['functionCalls']
): string[] {
  if (functionCalls.length === 0) return []

  const lines: string[] = []
  lines.push(`## Function Calls (${functionCalls.length})`)
  lines.push('')

  for (const call of functionCalls) {
    const pos = formatPosition(call.position.start)
    const args = call.arguments.length > 0 ? call.arguments.join(', ') : 'none'
    lines.push(`- ${call.name}(${args})${pos}`)
  }

  lines.push('')
  return lines
}

function buildClassesSection(classes: MappedParseResult['classes']): string[] {
  if (classes.length === 0) return []

  const lines: string[] = []
  lines.push(`## Classes (${classes.length})`)
  lines.push('')

  for (const cls of classes) {
    const pos = formatPosition(cls.position.start)
    const extendsClause = cls.extends ? ` extends ${cls.extends}` : ''
    const implementsClause =
      cls.implements && cls.implements.length > 0
        ? ` implements ${cls.implements.join(', ')}`
        : ''

    lines.push(`- ${cls.name}${extendsClause}${implementsClause}${pos}`)

    if (cls.properties.length > 0) {
      lines.push('  Properties:')
      for (const prop of cls.properties) {
        const visibility = prop.visibility ? `${prop.visibility} ` : ''
        const readonly = prop.isReadonly ? 'readonly ' : ''
        lines.push(
          `  - ${visibility}${readonly}${prop.name}${prop.type ? `: ${prop.type}` : ''}`
        )
      }
    }

    if (cls.methods.length > 0) {
      lines.push('  Methods:')
      for (const method of cls.methods) {
        const params = formatParameters(method.parameters)
        lines.push(
          `  - ${method.name}(${params}) -> ${method.returnType || 'void'}`
        )
      }
    }
  }

  lines.push('')
  return lines
}

function buildVariablesSection(
  variables: MappedParseResult['variables']
): string[] {
  if (variables.length === 0) return []

  const lines: string[] = []
  lines.push(`## Variables (${variables.length})`)
  lines.push('')

  for (const v of variables) {
    const pos = formatPosition(v.position)
    const constKeyword = v.isConst ? 'const' : 'let'
    const value = formatVariableValue(v.value || '')
    lines.push(
      `- ${constKeyword} ${v.name}${v.type ? `: ${v.type}` : ''} = ${value}${pos}`
    )
  }

  lines.push('')
  return lines
}

function buildImportsSection(imports: MappedParseResult['imports']): string[] {
  if (imports.length === 0) return []

  const lines: string[] = []
  lines.push(`## Imports (${imports.length})`)
  lines.push('')

  for (const imp of imports) {
    const pos = formatPosition(imp.position)
    const importStr = formatImport(imp)
    lines.push(`- ${importStr}${pos}`)
  }

  lines.push('')
  return lines
}

function buildExportsSection(exports: MappedParseResult['exports']): string[] {
  if (exports.length === 0) return []

  const lines: string[] = []
  lines.push(`## Exports (${exports.length})`)
  lines.push('')

  for (const exp of exports) {
    const pos = formatPosition(exp.position)
    const exportStr = formatExport(exp)
    lines.push(`- ${exportStr}${pos}`)
  }

  lines.push('')
  return lines
}

function buildTypesSection(types: MappedParseResult['types']): string[] {
  if (types.length === 0) return []

  const lines: string[] = []
  lines.push(`## Types (${types.length})`)
  lines.push('')

  for (const t of types) {
    const pos = formatPosition(t.position.start)
    lines.push(`- ${t.name} (${t.kind})${pos}`)

    if (t.properties.length > 0) {
      lines.push('  Properties:')
      for (const prop of t.properties) {
        const optional = prop.isOptional ? '?' : ''
        const readonly = prop.isReadonly ? 'readonly ' : ''
        lines.push(
          `  - ${readonly}${prop.name}${optional}: ${prop.type || 'any'}`
        )
      }
    }

    if (t.methods.length > 0) {
      lines.push('  Methods:')
      for (const method of t.methods) {
        const params = formatParameters(method.parameters)
        lines.push(
          `  - ${method.name}(${params}) -> ${method.returnType || 'void'}`
        )
      }
    }
  }

  lines.push('')
  return lines
}

function buildVueTemplateSection(
  vueTemplate: NonNullable<MappedParseResult['vueTemplate']>
): string[] {
  const lines: string[] = []

  const hasDirectives = vueTemplate.directives.length > 0
  const hasBindings = vueTemplate.bindings.length > 0
  const hasEvents = vueTemplate.events.length > 0
  const hasComponents = vueTemplate.components.length > 0

  if (!hasDirectives && !hasBindings && !hasEvents && !hasComponents) {
    return []
  }

  lines.push('## Vue Template')
  lines.push('')

  if (hasDirectives) {
    lines.push('Directives:')
    for (const dir of vueTemplate.directives) {
      const modifiers =
        dir.modifiers.length > 0 ? `.${dir.modifiers.join('.')}` : ''
      const value = dir.value ? `="${dir.value}"` : ''
      lines.push(`- v-${dir.name}${modifiers}${value} on <${dir.element}>`)
    }
    lines.push('')
  }

  if (hasBindings) {
    lines.push('Bindings:')
    for (const bind of vueTemplate.bindings) {
      lines.push(`- :${bind.name} = ${bind.expression} on <${bind.element}>`)
    }
    lines.push('')
  }

  if (hasEvents) {
    lines.push('Events:')
    for (const evt of vueTemplate.events) {
      const modifiers =
        evt.modifiers.length > 0 ? `.${evt.modifiers.join('.')}` : ''
      lines.push(
        `- @${evt.name}${modifiers} = ${evt.handler} on <${evt.element}>`
      )
    }
    lines.push('')
  }

  if (hasComponents) {
    lines.push('Components:')
    for (const comp of vueTemplate.components) {
      lines.push(`- <${comp}>`)
    }
    lines.push('')
  }

  return lines
}

function buildVueOptionsAPISection(
  vueOptionsAPI: NonNullable<MappedParseResult['vueOptionsAPI']>
): string[] {
  const lines: string[] = []

  const hasData = vueOptionsAPI.dataProperties.length > 0
  const hasComputed = vueOptionsAPI.computedProperties.length > 0
  const hasWatch = vueOptionsAPI.watchProperties.length > 0
  const hasMethods = vueOptionsAPI.methods.length > 0
  const hasLifecycle = vueOptionsAPI.lifecycleHooks.length > 0

  if (!hasData && !hasComputed && !hasWatch && !hasMethods && !hasLifecycle) {
    return []
  }

  lines.push('## Vue Options API')
  lines.push('')

  if (hasData) {
    lines.push('Data Properties:')
    for (const prop of vueOptionsAPI.dataProperties) {
      lines.push(`- ${prop}`)
    }
    lines.push('')
  }

  if (hasComputed) {
    lines.push('Computed Properties:')
    for (const prop of vueOptionsAPI.computedProperties) {
      lines.push(`- ${prop}`)
    }
    lines.push('')
  }

  if (hasWatch) {
    lines.push('Watch Properties:')
    for (const prop of vueOptionsAPI.watchProperties) {
      lines.push(`- ${prop}`)
    }
    lines.push('')
  }

  if (hasMethods) {
    lines.push('Methods:')
    for (const method of vueOptionsAPI.methods) {
      lines.push(`- ${method}`)
    }
    lines.push('')
  }

  if (hasLifecycle) {
    lines.push('Lifecycle Hooks:')
    for (const hook of vueOptionsAPI.lifecycleHooks) {
      lines.push(`- ${hook}`)
    }
    lines.push('')
  }

  return lines
}

export function buildSummary(
  result: MappedParseResult,
  filepath: string
): string {
  const lines: string[] = []

  lines.push(`# Code Analysis: ${filepath}`)
  lines.push('')
  lines.push(`Language: ${result.language}`)
  lines.push('')

  lines.push(...buildFunctionsSection(result.functions))
  lines.push(...buildFunctionCallsSection(result.functionCalls))
  lines.push(...buildClassesSection(result.classes))
  lines.push(...buildVariablesSection(result.variables))
  lines.push(...buildImportsSection(result.imports))
  lines.push(...buildExportsSection(result.exports))
  lines.push(...buildTypesSection(result.types))

  if (result.vueTemplate) {
    lines.push(...buildVueTemplateSection(result.vueTemplate))
  }

  if (result.vueOptionsAPI) {
    lines.push(...buildVueOptionsAPISection(result.vueOptionsAPI))
  }

  const summary = lines.join('\n')

  logger.debug(
    `=== Summary for ${filepath} ===\n${summary}\n=== End of Summary ===`
  )

  return summary
}
