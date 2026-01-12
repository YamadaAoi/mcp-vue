import type {
  VueParseResult,
  VueCompositionAPIInfo,
  PropInfo,
  EmitInfo,
  RefInfo,
  ReactiveInfo,
  ComputedInfo,
  WatchInfo,
  WatchEffectInfo,
  LifecycleHookInfo,
  ProvideInfo,
  InjectInfo,
  VariableInfo,
  ExposeInfo,
  VueMethodInfo,
  SlotsInfo,
  AttrsInfo,
  ImportInfo
} from './types'
import { getLogger } from '../../../utils/logger'
import {
  formatPosition,
  formatParameters,
  formatImport
} from '../../../utils/formatters'
import {
  type SummaryOptions,
  DEFAULT_SUMMARY_OPTIONS
} from '../../../utils/summaryConfig'

const logger = getLogger()

function formatVueImport(imp: ImportInfo): string {
  return formatImport(
    imp.importedNames,
    imp.source,
    imp.isDefaultImport,
    imp.isNamespaceImport
  )
}

function buildComponentMetadataSection(
  metadata: VueParseResult['componentMetadata']
): string[] {
  if (!metadata) return []

  const lines: string[] = []
  lines.push('## Component Metadata')
  lines.push('')

  if (metadata.name) {
    lines.push(`- Name: ${metadata.name}`)
  }

  if (typeof metadata.inheritAttrs === 'boolean') {
    lines.push(`- Inherit Attrs: ${metadata.inheritAttrs}`)
  }

  lines.push('')
  return lines
}

function buildScriptTypeSection(
  scriptType: VueParseResult['scriptType']
): string[] {
  if (!scriptType) return []

  const lines: string[] = []
  lines.push('## Script Type')
  lines.push('')
  lines.push(`- ${scriptType}`)
  lines.push('')
  return lines
}

function buildTemplateInfoSection(
  templateInfo: VueParseResult['templateInfo']
): string[] {
  if (!templateInfo) return []

  const lines: string[] = []
  lines.push('## Template Info')
  lines.push('')

  if (templateInfo.hasTemplate) {
    lines.push('- Has Template: Yes')

    if (templateInfo.directives && templateInfo.directives.length > 0) {
      lines.push(`- Directives: ${templateInfo.directives.join(', ')}`)
    }

    if (templateInfo.components && templateInfo.components.length > 0) {
      lines.push(`- Components: ${templateInfo.components.join(', ')}`)
    }

    if (templateInfo.slots && templateInfo.slots.length > 0) {
      lines.push(`- Slots: ${templateInfo.slots.join(', ')}`)
    }
  } else {
    lines.push('- Has Template: No')
  }

  lines.push('')
  return lines
}

function buildStyleInfoSection(
  styleInfo: VueParseResult['styleInfo']
): string[] {
  if (!styleInfo || styleInfo.length === 0) return []

  const lines: string[] = []
  lines.push(`## Style Info (${styleInfo.length})`)
  lines.push('')

  for (const style of styleInfo) {
    lines.push(`- Has Style: ${style.hasStyle ? 'Yes' : 'No'}`)

    if (style.lang) {
      lines.push(`  - Language: ${style.lang}`)
    }

    if (typeof style.scoped === 'boolean') {
      lines.push(`  - Scoped: ${style.scoped}`)
    }

    if (style.module) {
      lines.push(`  - Module: ${style.module}`)
    }
  }

  lines.push('')
  return lines
}

function buildPropsSection(
  props: PropInfo[] | undefined,
  options: SummaryOptions
): string[] {
  if (!props || props.length === 0) return []

  const lines: string[] = []
  lines.push(`## Props (${props.length})`)
  lines.push('')

  for (const prop of props) {
    const pos = options.showPositions ? formatPosition(prop.startPosition) : ''
    const type = options.showTypes && prop.type ? `: ${prop.type}` : ''
    const required = prop.required ? ' (required)' : ''
    const model = prop.isModelProp ? ' [v-model]' : ''
    const slots = prop.isSlotsProp ? ' [slots]' : ''
    const comment =
      options.showComments && prop.comment ? ` - ${prop.comment}` : ''

    lines.push(
      `- ${prop.name}${type}${required}${model}${slots}${comment}${pos}`
    )

    if (prop.default) {
      const defaultType = prop.default.type
      if (defaultType === 'primitive' && prop.default.value !== undefined) {
        lines.push(`  - Default: ${prop.default.value}`)
      } else if (prop.default.isFactory && prop.default.factoryExpression) {
        lines.push(`  - Default: ${prop.default.factoryExpression}`)
      }
    }
  }

  lines.push('')
  return lines
}

function buildEmitsSection(
  emits: EmitInfo[] | undefined,
  options: SummaryOptions
): string[] {
  if (!emits || emits.length === 0) return []

  const lines: string[] = []
  lines.push(`## Emits (${emits.length})`)
  lines.push('')

  for (const emit of emits) {
    const pos = options.showPositions ? formatPosition(emit.startPosition) : ''
    const params = emit.parameters ? emit.parameters.join(', ') : 'none'
    const model = emit.isModelEvent ? ' [v-model]' : ''
    const comment =
      options.showComments && emit.comment ? ` - ${emit.comment}` : ''

    lines.push(`- ${emit.name}(${params})${model}${comment}${pos}`)
  }

  lines.push('')
  return lines
}

function buildRefsSection(
  refs: RefInfo[] | undefined,
  options: SummaryOptions
): string[] {
  if (!refs || refs.length === 0) return []

  const lines: string[] = []
  lines.push(`## Refs (${refs.length})`)
  lines.push('')

  for (const ref of refs) {
    const pos = options.showPositions ? formatPosition(ref.startPosition) : ''
    const type = options.showTypes && ref.type ? `: ${ref.type}` : ''
    const shallow = ref.isShallow ? ' [shallow]' : ''

    lines.push(`- ${ref.name}${type}${shallow}${pos}`)
  }

  lines.push('')
  return lines
}

function buildReactivesSection(
  reactives: ReactiveInfo[] | undefined,
  options: SummaryOptions
): string[] {
  if (!reactives || reactives.length === 0) return []

  const lines: string[] = []
  lines.push(`## Reactives (${reactives.length})`)
  lines.push('')

  for (const reactive of reactives) {
    const pos = options.showPositions
      ? formatPosition(reactive.startPosition)
      : ''
    const type = options.showTypes && reactive.type ? `: ${reactive.type}` : ''
    const shallow = reactive.isShallow ? ' [shallow]' : ''

    lines.push(`- ${reactive.name}${type}${shallow}${pos}`)
  }

  lines.push('')
  return lines
}

function buildComputedSection(
  computed: ComputedInfo[] | undefined,
  options: SummaryOptions
): string[] {
  if (!computed || computed.length === 0) return []

  const lines: string[] = []
  lines.push(`## Computed (${computed.length})`)
  lines.push('')

  for (const comp of computed) {
    const pos = options.showPositions ? formatPosition(comp.startPosition) : ''
    const type = options.showTypes && comp.type ? `: ${comp.type}` : ''
    const readonly = comp.isReadonly ? ' [readonly]' : ''
    const setter = comp.hasSetter ? ' [setter]' : ''
    const deps = comp.dependencies
      ? ` [deps: ${comp.dependencies.join(', ')}]`
      : ''
    const comment =
      options.showComments && comp.comment ? ` - ${comp.comment}` : ''

    lines.push(
      `- ${comp.name}${type}${readonly}${setter}${deps}${comment}${pos}`
    )
  }

  lines.push('')
  return lines
}

function buildWatchSection(
  watch: WatchInfo[] | undefined,
  options: SummaryOptions
): string[] {
  if (!watch || watch.length === 0) return []

  const lines: string[] = []
  lines.push(`## Watch (${watch.length})`)
  lines.push('')

  for (const w of watch) {
    const pos = options.showPositions ? formatPosition(w.startPosition) : ''
    const deps = w.dependencies.join(', ')
    const deep = w.isDeep ? ' [deep]' : ''
    const immediate = w.isImmediate ? ' [immediate]' : ''
    const flush = w.flush ? ` [flush: ${w.flush}]` : ''
    const array = w.isArrayWatch ? ' [array]' : ''

    lines.push(`- ${w.name}(${deps})${deep}${immediate}${flush}${array}${pos}`)
  }

  lines.push('')
  return lines
}

function buildWatchEffectsSection(
  watchEffects: WatchEffectInfo[] | undefined,
  options: SummaryOptions
): string[] {
  if (!watchEffects || watchEffects.length === 0) return []

  const lines: string[] = []
  lines.push(`## Watch Effects (${watchEffects.length})`)
  lines.push('')

  for (const effect of watchEffects) {
    const pos = options.showPositions
      ? formatPosition(effect.startPosition)
      : ''
    const name = effect.name ? effect.name : 'anonymous'
    const lazy = effect.isLazy ? ' [lazy]' : ''

    lines.push(`- ${name}${lazy}${pos}`)
  }

  lines.push('')
  return lines
}

function buildLifecycleHooksSection(
  lifecycleHooks: LifecycleHookInfo[] | undefined,
  options: SummaryOptions
): string[] {
  if (!lifecycleHooks || lifecycleHooks.length === 0) return []

  const lines: string[] = []
  lines.push(`## Lifecycle Hooks (${lifecycleHooks.length})`)
  lines.push('')

  for (const hook of lifecycleHooks) {
    const pos = options.showPositions ? formatPosition(hook.startPosition) : ''
    const params = hook.parameters ? hook.parameters.join(', ') : 'none'

    lines.push(`- ${hook.name}(${params})${pos}`)
  }

  lines.push('')
  return lines
}

function buildProvideSection(
  provide: ProvideInfo[] | undefined,
  options: SummaryOptions
): string[] {
  if (!provide || provide.length === 0) return []

  const lines: string[] = []
  lines.push(`## Provide (${provide.length})`)
  lines.push('')

  for (const p of provide) {
    const pos = options.showPositions ? formatPosition(p.startPosition) : ''
    const type = options.showTypes && p.type ? `: ${p.type}` : ''
    const symbol = p.isSymbolKey ? ' [symbol]' : ''
    const reactive = p.isReactive ? ' [reactive]' : ''

    lines.push(`- ${p.key}${type}${symbol}${reactive}${pos}`)
  }

  lines.push('')
  return lines
}

function buildInjectSection(
  inject: InjectInfo[] | undefined,
  options: SummaryOptions
): string[] {
  if (!inject || inject.length === 0) return []

  const lines: string[] = []
  lines.push(`## Inject (${inject.length})`)
  lines.push('')

  for (const i of inject) {
    const pos = options.showPositions ? formatPosition(i.startPosition) : ''
    const alias = i.alias ? ` as ${i.alias}` : ''
    const type = options.showTypes && i.type ? `: ${i.type}` : ''
    const symbol = i.isSymbolKey ? ' [symbol]' : ''
    const reactive = i.isReactive ? ' [reactive]' : ''

    lines.push(`- ${i.key}${alias}${type}${symbol}${reactive}${pos}`)
  }

  lines.push('')
  return lines
}

function buildVariablesSection(
  variables: VariableInfo[] | undefined,
  options: SummaryOptions
): string[] {
  if (!variables || variables.length === 0) return []

  const lines: string[] = []
  lines.push(`## Variables (${variables.length})`)
  lines.push('')

  for (const v of variables) {
    const pos = options.showPositions ? formatPosition(v.startPosition) : ''
    const constKeyword = v.isConst ? 'const' : 'let'
    const type = options.showTypes && v.type ? `: ${v.type}` : ''

    lines.push(`- ${constKeyword} ${v.name}${type}${pos}`)
  }

  lines.push('')
  return lines
}

function buildExposeSection(
  expose: ExposeInfo[] | undefined,
  options: SummaryOptions
): string[] {
  if (!expose || expose.length === 0) return []

  const lines: string[] = []
  lines.push(`## Expose (${expose.length})`)
  lines.push('')

  for (const e of expose) {
    const pos = options.showPositions ? formatPosition(e.startPosition) : ''
    const type = e.type === 'property' ? 'property' : 'method'
    const valueType = options.showTypes && e.valueType ? `: ${e.valueType}` : ''

    lines.push(`- ${e.name} [${type}]${valueType}${pos}`)
  }

  lines.push('')
  return lines
}

function buildMethodsSection(
  methods: VueMethodInfo[] | undefined,
  options: SummaryOptions
): string[] {
  if (!methods || methods.length === 0) return []

  const lines: string[] = []
  lines.push(`## Methods (${methods.length})`)
  lines.push('')

  for (const method of methods) {
    const pos = options.showPositions
      ? formatPosition(method.startPosition)
      : ''
    const params = formatParameters(method.parameters)
    const returnType =
      options.showTypes && method.returnType ? ` -> ${method.returnType}` : ''
    const async = method.isAsync ? 'async ' : ''
    const privateKeyword = method.isPrivate ? ' [private]' : ''
    const comment =
      options.showComments && method.comment ? ` - ${method.comment}` : ''

    lines.push(
      `- ${async}${method.name}(${params})${returnType}${privateKeyword}${comment}${pos}`
    )
  }

  lines.push('')
  return lines
}

function buildSlotsSection(
  slots: SlotsInfo[] | undefined,
  options: SummaryOptions
): string[] {
  if (!slots || slots.length === 0) return []

  const lines: string[] = []
  lines.push(`## Slots (${slots.length})`)
  lines.push('')

  for (const slot of slots) {
    const pos = options.showPositions ? formatPosition(slot.startPosition) : ''
    const type = slot.type || 'default'

    lines.push(`- ${slot.name} [${type}]${pos}`)
  }

  lines.push('')
  return lines
}

function buildAttrsSection(attrs: AttrsInfo | undefined): string[] {
  if (!attrs) return []

  const lines: string[] = []
  lines.push('## Attrs')
  lines.push('')

  if (attrs.hasAttrs) {
    lines.push('- Has Attrs: Yes')

    if (attrs.attrs) {
      lines.push('  - Attributes:')
      for (const [key, value] of Object.entries(attrs.attrs)) {
        lines.push(`    - ${key}: ${value}`)
      }
    }
  } else {
    lines.push('- Has Attrs: No')
  }

  lines.push('')
  return lines
}

function buildImportsSection(
  imports: VueParseResult['imports'],
  options: SummaryOptions
): string[] {
  if (!imports || imports.length === 0) return []

  const lines: string[] = []
  lines.push(`## Imports (${imports.length})`)
  lines.push('')

  for (const imp of imports) {
    const pos =
      options.showPositions && imp.startPosition
        ? formatPosition(imp.startPosition)
        : ''
    const typeImport = imp.isTypeImport ? ' [type]' : ''
    const importStr = formatVueImport(imp)
    lines.push(`- ${importStr}${typeImport}${pos}`)
  }

  lines.push('')
  return lines
}

function buildOptionsAPISection(
  optionsAPI: VueParseResult['optionsAPI']
): string[] {
  if (!optionsAPI) return []

  const lines: string[] = []
  lines.push('## Options API')
  lines.push('')

  if (optionsAPI.name) {
    lines.push(`- Name: ${optionsAPI.name}`)
  }

  if (typeof optionsAPI.inheritAttrs === 'boolean') {
    lines.push(`- Inherit Attrs: ${optionsAPI.inheritAttrs}`)
  }

  if (optionsAPI.props && optionsAPI.props.length > 0) {
    lines.push(`- Props: ${optionsAPI.props.length}`)
  }

  if (optionsAPI.emits && optionsAPI.emits.length > 0) {
    lines.push(`- Emits: ${optionsAPI.emits.length}`)
  }

  if (optionsAPI.dataProperties && optionsAPI.dataProperties.length > 0) {
    lines.push(`- Data Properties: ${optionsAPI.dataProperties.length}`)
  }

  if (
    optionsAPI.computedProperties &&
    optionsAPI.computedProperties.length > 0
  ) {
    lines.push(`- Computed Properties: ${optionsAPI.computedProperties.length}`)
  }

  if (optionsAPI.watchProperties && optionsAPI.watchProperties.length > 0) {
    lines.push(`- Watch Properties: ${optionsAPI.watchProperties.length}`)
  }

  if (optionsAPI.methods && optionsAPI.methods.length > 0) {
    lines.push(`- Methods: ${optionsAPI.methods.length}`)
  }

  if (optionsAPI.lifecycleHooks && optionsAPI.lifecycleHooks.length > 0) {
    lines.push(`- Lifecycle Hooks: ${optionsAPI.lifecycleHooks.length}`)
  }

  if (
    'filters' in optionsAPI &&
    optionsAPI.filters &&
    optionsAPI.filters.length > 0
  ) {
    lines.push(`- Filters: ${optionsAPI.filters.length}`)
  }

  if (optionsAPI.directives && optionsAPI.directives.length > 0) {
    lines.push(`- Directives: ${optionsAPI.directives.length}`)
  }

  if (optionsAPI.mixins && optionsAPI.mixins.length > 0) {
    lines.push(`- Mixins: ${optionsAPI.mixins.length}`)
  }

  if (optionsAPI.components && optionsAPI.components.length > 0) {
    lines.push(`- Components: ${optionsAPI.components.length}`)
  }

  if (optionsAPI.model) {
    lines.push(`- Model: ${optionsAPI.model}`)
  }

  lines.push('')
  return lines
}

function buildCompositionAPISection(
  compositionAPI: VueCompositionAPIInfo | undefined,
  options: SummaryOptions
): string[] {
  if (!compositionAPI) return []

  const lines: string[] = []

  lines.push(...buildPropsSection(compositionAPI.props, options))
  lines.push(...buildEmitsSection(compositionAPI.emits, options))
  lines.push(...buildRefsSection(compositionAPI.refs, options))
  lines.push(...buildReactivesSection(compositionAPI.reactives, options))
  lines.push(...buildComputedSection(compositionAPI.computed, options))
  lines.push(...buildWatchSection(compositionAPI.watch, options))
  lines.push(...buildWatchEffectsSection(compositionAPI.watchEffects, options))
  lines.push(
    ...buildLifecycleHooksSection(compositionAPI.lifecycleHooks, options)
  )
  lines.push(...buildProvideSection(compositionAPI.provide, options))
  lines.push(...buildInjectSection(compositionAPI.inject, options))
  lines.push(...buildVariablesSection(compositionAPI.variables, options))
  lines.push(...buildExposeSection(compositionAPI.expose, options))
  lines.push(...buildMethodsSection(compositionAPI.methods, options))
  lines.push(...buildSlotsSection(compositionAPI.slots, options))
  lines.push(...buildAttrsSection(compositionAPI.attrs))

  return lines
}

export function buildSummary(
  result: VueParseResult,
  filepath: string,
  options: SummaryOptions = {}
): string {
  const opts = { ...DEFAULT_SUMMARY_OPTIONS, ...options }
  const lines: string[] = []

  lines.push(`# Vue Component Analysis: ${filepath}`)
  lines.push('')
  lines.push(`Language: ${result.language}`)
  lines.push('')

  lines.push(...buildComponentMetadataSection(result.componentMetadata))
  lines.push(...buildScriptTypeSection(result.scriptType))
  lines.push(...buildTemplateInfoSection(result.templateInfo))
  lines.push(...buildStyleInfoSection(result.styleInfo))
  lines.push(...buildOptionsAPISection(result.optionsAPI))
  lines.push(...buildCompositionAPISection(result.compositionAPI, opts))
  lines.push(...buildImportsSection(result.imports, opts))

  const summary = lines.join('\n')

  logger.debug(
    `=== Summary for ${filepath} ===\n${summary}\n=== End of Summary ===`
  )

  return summary
}
