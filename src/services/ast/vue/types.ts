// eslint-disable-next-line @typescript-eslint/no-explicit-any
type initialValue = any

// 带位置信息的基础接口 - 数组格式 [startRow, startColumn, endRow, endColumn]
export interface Locatable {
  position: [number, number, number, number]
}

// Prop默认值类型
export interface PropDefault {
  type: 'primitive' | 'object' | 'array' | 'function' | 'expression'
  value?: initialValue // 原始值的情况
  isFactory?: boolean // 是否是工厂函数
  factoryExpression?: string // 工厂函数表达式
}

// 通用的Prop信息接口
export interface PropInfo extends Locatable {
  name: string
  type?: string
  default?: PropDefault
  required?: boolean
  validator?: boolean
  validatorExpression?: string
  isModelProp?: boolean
  isSlotsProp?: boolean
  comment?: string
}

// 通用的Emit信息接口
export interface EmitInfo extends Locatable {
  name: string
  parameters?: string[]
  type?: string
  isModelEvent?: boolean
  comment?: string
}

// 通用的Method信息接口
export interface VueMethodInfo extends Locatable {
  name: string
  parameters: string[]
  returnType?: string
  isAsync?: boolean
  isPrivate?: boolean
  comment?: string
}

// Composition API - Ref信息
export interface RefInfo extends Locatable {
  name: string
  type?: string
  initialValue?: initialValue
  isShallow?: boolean
}

// Composition API - Reactive信息
export interface ReactiveInfo extends Locatable {
  name: string
  type?: string
  initialValue?: initialValue
  isShallow?: boolean
}

// Composition API - Computed信息
export interface ComputedInfo extends Locatable {
  name: string
  type?: string
  isReadonly?: boolean
  hasSetter?: boolean
  dependencies?: string[]
  comment?: string
}

// Composition API - Watch信息
export interface WatchInfo extends Locatable {
  name: string
  dependencies: string[]
  isDeep?: boolean
  isImmediate?: boolean
  flush?: 'pre' | 'post' | 'sync'
  isArrayWatch?: boolean
  callbackType?: 'function' | 'object'
}

// Composition API - WatchEffect信息
export interface WatchEffectInfo extends Locatable {
  name?: string
  isLazy?: boolean
}

// Composition API - Lifecycle Hook信息
export interface LifecycleHookInfo extends Locatable {
  name: string
  parameters?: string[]
}

// Composition API - Provide信息
export interface ProvideInfo extends Locatable {
  key: string
  value?: initialValue
  type?: string
  isSymbolKey?: boolean
  isReactive?: boolean
}

// Composition API - Inject信息
export interface InjectInfo extends Locatable {
  key: string
  alias?: string
  default?: initialValue
  type?: string
  isSymbolKey?: boolean
  isReactive?: boolean
}

// Composition API - Variable信息
export interface VariableInfo extends Locatable {
  name: string
  type?: string
  value?: initialValue
  isConst?: boolean
}

// Composition API - Expose信息
export interface ExposeInfo extends Locatable {
  name: string
  type: 'property' | 'method'
  valueType?: string
  initialValue?: initialValue
}

// Options API - Data Property信息
export interface DataPropertyInfo extends Locatable {
  name: string
  type?: string
  initialValue?: initialValue
}

// Options API - Computed Property信息
export interface ComputedPropertyInfo extends Locatable {
  name: string
  type?: string
  dependencies?: string[]
  isGetter?: boolean
  isSetter?: boolean
}

// Options API - Watch Property信息
export interface WatchPropertyInfo extends Locatable {
  name: string
  dependencies: string[]
  parameters?: string[]
  isDeep?: boolean
  isImmediate?: boolean
  callbackType?: 'function' | 'object'
}

// Options API - Filter信息
export interface FilterInfo extends Locatable {
  name: string
  parameters: string[]
  returnType?: string
}

// Options API - Directive信息
export interface DirectiveInfo extends Locatable {
  name: string
  hook?: string
}

// Options API - Mixin信息
export interface MixinInfo extends Locatable {
  name: string
  source?: string
}

// Options API - Component信息
export interface ComponentInfo extends Locatable {
  name: string
  source?: string
  isGlobal?: boolean
}

export interface TemplateInfo {
  hasTemplate: boolean
  directives?: string[]
  components?: string[]
  slots?: string[]
}

export interface StyleInfo {
  lang?: string
  scoped?: boolean
  module?: string
  hasStyle: boolean
}

export interface SlotsInfo extends Locatable {
  name: string
  type?: 'default' | 'named' | 'scoped'
}

export interface AttrsInfo extends Locatable {
  hasAttrs: boolean
  attrs?: Record<string, string>
}

export interface ImportInfo extends Locatable {
  source: string
  importedNames: string[]
  isDefaultImport: boolean
  isNamespaceImport: boolean
  isTypeImport?: boolean
}

// Vue 2 Options API 信息接口
export interface Vue2OptionsAPIInfo {
  name?: string
  inheritAttrs?: boolean
  dataProperties?: DataPropertyInfo[]
  computedProperties?: ComputedPropertyInfo[]
  watchProperties?: WatchPropertyInfo[]
  methods?: VueMethodInfo[]
  lifecycleHooks?: LifecycleHookInfo[]
  filters?: FilterInfo[]
  directives?: DirectiveInfo[]
  mixins?: MixinInfo[]
  components?: ComponentInfo[]
  props?: PropInfo[]
  emits?: EmitInfo[]
  model?: string
}

// Vue 3 Options API 信息接口（扩展Vue2的接口，适应Vue3的变化）
export interface Vue3OptionsAPIInfo extends Omit<
  Vue2OptionsAPIInfo,
  'filters' | 'lifecycleHooks'
> {
  lifecycleHooks?: LifecycleHookInfo[]
  setup?: string
}

// Vue 3 Composition API 信息接口
export interface VueCompositionAPIInfo {
  refs?: RefInfo[]
  reactives?: ReactiveInfo[]
  computed?: ComputedInfo[]
  watch?: WatchInfo[]
  watchEffects?: WatchEffectInfo[]
  lifecycleHooks?: LifecycleHookInfo[]
  provide?: ProvideInfo[]
  inject?: InjectInfo[]
  variables?: VariableInfo[]
  expose?: ExposeInfo[]
  props?: PropInfo[]
  emits?: EmitInfo[]
  methods?: VueMethodInfo[]
  slots?: SlotsInfo[]
  attrs?: AttrsInfo
}

// Vue 组件解析结果接口（具有Vue特色的返回类型）
export interface VueParseResult {
  language: 'vue'
  componentMetadata?: {
    name?: string
    inheritAttrs?: boolean
  }
  scriptType?: 'setup' | 'normal' | 'module'
  templateInfo?: TemplateInfo
  styleInfo?: StyleInfo[]
  optionsAPI?: Vue2OptionsAPIInfo | Vue3OptionsAPIInfo
  compositionAPI?: VueCompositionAPIInfo
  imports?: ImportInfo[]
}
