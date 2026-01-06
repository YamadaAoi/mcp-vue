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
  classes: ClassInfo[]
  variables: VariableInfo[]
  imports: ImportInfo[]
  exports: ExportInfo[]
  types: TypeInfo[]
  vueTemplate?: VueTemplateInfo
}

export interface FunctionInfo {
  name: string
  type: string
  parameters: string[]
  returnType?: string
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
}

export interface ClassInfo {
  name: string
  extends?: string
  implements?: string[]
  methods: MethodInfo[]
  properties: PropertyInfo[]
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
}

export interface MethodInfo {
  name: string
  parameters: string[]
  returnType?: string
  isStatic: boolean
  isAsync: boolean
}

export interface PropertyInfo {
  name: string
  type?: string
  isStatic: boolean
  visibility?: 'public' | 'private' | 'protected'
}

export interface VariableInfo {
  name: string
  type?: string
  value?: string
  isConst: boolean
  startPosition: { row: number; column: number }
}

export interface ImportInfo {
  source: string
  imports: string[]
  isDefault: boolean
  isNamespace: boolean
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

export interface TreeSitterNode {
  type: string
  text: string
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
  children: TreeSitterNode[]
}

export interface CacheEntry {
  hash: string
  result: ParseResult
  timestamp: number
}
