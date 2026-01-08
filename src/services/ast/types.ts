export interface ASTNode {
  type: string
  text: string
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
  children: ASTNode[]
}

export interface ParseResult {
  language: string
  ast: ASTNode
  functions: FunctionInfo[]
  functionCalls: FunctionCallInfo[]
  classes: ClassInfo[]
  variables: VariableInfo[]
  imports: ImportInfo[]
  exports: ExportInfo[]
  types: TypeInfo[]
  vueTemplate?: VueTemplateInfo
  vueOptionsAPI?: VueOptionsAPIInfo
}

export interface FunctionInfo {
  name: string
  type: string
  parameters: string[]
  returnType?: string
  isAsync: boolean
  isGenerator: boolean
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
}

export interface FunctionCallInfo {
  name: string
  arguments: string[]
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
}

export interface ClassInfo {
  name: string
  extends?: string
  implements?: string[]
  typeParameters?: string[]
  decorators?: string[]
  isAbstract: boolean
  methods: MethodInfo[]
  properties: PropertyInfo[]
  accessors?: AccessorInfo[]
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
}

export interface MethodInfo {
  name: string
  parameters: string[]
  returnType?: string
  typeParameters?: string[]
  decorators?: string[]
  isStatic: boolean
  isAsync: boolean
  isAbstract: boolean
  accessor?: 'get' | 'set'
}

export interface PropertyInfo {
  name: string
  type?: string
  isStatic: boolean
  isAbstract: boolean
  isReadonly: boolean
  visibility?: 'public' | 'private' | 'protected'
  decorators?: string[]
}

export interface AccessorInfo {
  name: string
  type?: string
  isStatic: boolean
  accessor: 'get' | 'set'
  decorators?: string[]
}

export interface VariableInfo {
  name: string
  type?: string
  value?: string
  isConst: boolean
  isReadonly: boolean
  isExported: boolean
  scope?: 'local' | 'module' | 'global'
  decorators?: string[]
  startPosition: { row: number; column: number }
}

export interface ImportInfo {
  source: string
  imports: string[]
  isDefault: boolean
  isNamespace: boolean
  isTypeOnly: boolean
  isSideEffect: boolean
  startPosition: { row: number; column: number }
}

export interface ExportInfo {
  name: string
  type: 'function' | 'class' | 'variable' | 'type'
  isDefault: boolean
  startPosition: { row: number; column: number }
}

export interface TypeInfo {
  name: string
  kind: 'interface' | 'type' | 'enum' | 'class'
  properties: TypePropertyInfo[]
  methods: MethodInfo[]
  typeParameters?: string[]
  extends?: string[]
  typeBody?: string
  enumMembers?: string[]
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
}

export interface TypePropertyInfo {
  name: string
  type?: string
  isOptional: boolean
  isReadonly: boolean
}

export interface VueTemplateInfo {
  directives: DirectiveInfo[]
  bindings: BindingInfo[]
  events: EventInfo[]
  components: string[]
}

export interface VueOptionsAPIInfo {
  dataProperties: string[]
  computedProperties: string[]
  watchProperties: string[]
  methods: string[]
  lifecycleHooks: string[]
}

export interface DirectiveInfo {
  name: string
  value?: string
  modifiers: string[]
  element: string
  startPosition: { row: number; column: number }
}

export interface BindingInfo {
  name: string
  expression: string
  element: string
  startPosition: { row: number; column: number }
}

export interface EventInfo {
  name: string
  handler: string
  modifiers: string[]
  element: string
  startPosition: { row: number; column: number }
}

export interface MappedParseResult {
  success: boolean
  language: string
  functions: Array<{
    name: string
    type: string
    parameters: string[]
    returnType?: string
    position: {
      start: { row: number; column: number }
      end: { row: number; column: number }
    }
  }>
  functionCalls: Array<{
    name: string
    arguments: string[]
    position: {
      start: { row: number; column: number }
      end: { row: number; column: number }
    }
  }>
  classes: Array<{
    name: string
    extends?: string
    implements?: string[]
    methods: Array<{
      name: string
      parameters: string[]
      returnType?: string
    }>
    properties: Array<{
      name: string
      type?: string
      isReadonly: boolean
      visibility?: 'public' | 'private' | 'protected'
    }>
    position: {
      start: { row: number; column: number }
      end: { row: number; column: number }
    }
  }>
  variables: Array<{
    name: string
    type?: string
    value?: string
    isConst: boolean
    position: { row: number; column: number }
  }>
  imports: Array<{
    source: string
    imports: string[]
    isDefault: boolean
    isNamespace: boolean
    position: { row: number; column: number }
  }>
  exports: Array<{
    name: string
    type: 'function' | 'class' | 'variable' | 'type'
    isDefault: boolean
    position: { row: number; column: number }
  }>
  types: Array<{
    name: string
    kind: 'interface' | 'type' | 'enum' | 'class'
    properties: Array<{
      name: string
      type?: string
      isOptional: boolean
      isReadonly: boolean
    }>
    methods: Array<{
      name: string
      parameters: string[]
      returnType?: string
    }>
    position: {
      start: { row: number; column: number }
      end: { row: number; column: number }
    }
  }>
  vueTemplate?: {
    directives: Array<{
      name: string
      value?: string
      modifiers: string[]
      element: string
      startPosition: { row: number; column: number }
    }>
    bindings: Array<{
      name: string
      expression: string
      element: string
      startPosition: { row: number; column: number }
    }>
    events: Array<{
      name: string
      handler: string
      modifiers: string[]
      element: string
      startPosition: { row: number; column: number }
    }>
    components: string[]
  }
  vueOptionsAPI?: {
    dataProperties: string[]
    computedProperties: string[]
    watchProperties: string[]
    methods: string[]
    lifecycleHooks: string[]
  }
}
