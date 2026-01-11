// eslint-disable-next-line @typescript-eslint/no-explicit-any
type initialValue = any

// 位置信息接口
export interface Position {
  row: number
  column: number
}

// 带位置信息的基础接口
export interface Locatable {
  startPosition: Position
  endPosition: Position
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
}

// 通用的Emit信息接口
export interface EmitInfo extends Locatable {
  name: string
  parameters?: string[]
  type?: string
}

// 通用的Method信息接口
export interface VueMethodInfo extends Locatable {
  name: string
  parameters: string[]
  returnType?: string
  isAsync?: boolean
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
  dependencies?: string[]
}

// Composition API - Watch信息
export interface WatchInfo extends Locatable {
  name: string
  dependencies: string[]
  isDeep?: boolean
  isImmediate?: boolean
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
}

// Composition API - Inject信息
export interface InjectInfo extends Locatable {
  key: string
  alias?: string
  default?: initialValue
  type?: string
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

// Vue 2 Options API 信息接口
export interface Vue2OptionsAPIInfo {
  dataProperties?: DataPropertyInfo[]
  computedProperties?: ComputedPropertyInfo[]
  watchProperties?: WatchPropertyInfo[]
  methods?: VueMethodInfo[] // Vue 2 options中的方法
  lifecycleHooks?: LifecycleHookInfo[]
  filters?: FilterInfo[]
  directives?: DirectiveInfo[]
  mixins?: MixinInfo[]
  components?: ComponentInfo[]
  props?: PropInfo[] // Vue 2 options中的props
  emits?: EmitInfo[] // Vue 2 options中的emits
  model?: string
}

// Vue 3 Options API 信息接口（扩展Vue2的接口，适应Vue3的变化）
export interface Vue3OptionsAPIInfo extends Omit<
  Vue2OptionsAPIInfo,
  'filters' | 'lifecycleHooks'
> {
  lifecycleHooks?: LifecycleHookInfo[]
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
  variables?: VariableInfo[] // Vue 3 setup中的变量
  expose?: ExposeInfo[] // Vue 3 setup中暴露的属性和方法
  props?: PropInfo[] // Vue 3 setup中的props
  emits?: EmitInfo[] // Vue 3 setup中的emits
  methods?: VueMethodInfo[] // Vue 3 setup中的方法
}

// Vue 组件解析结果接口（具有Vue特色的返回类型）
export interface VueParseResult {
  language: 'vue'
  optionsAPI?: Vue2OptionsAPIInfo | Vue3OptionsAPIInfo
  compositionAPI?: VueCompositionAPIInfo
  imports?: {
    source: string
    importedNames: string[]
    isDefaultImport: boolean
    isNamespaceImport: boolean
  }[]
}
