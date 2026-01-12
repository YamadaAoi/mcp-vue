export interface ASTNode {
  type: string
  text: string
  startPosition: { row: number; column: number }
  endPosition: { row: number; column: number }
  children: ASTNode[]
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

export interface TsParseResult {
  language: 'typescript' | 'tsx' | 'javascript' | 'jsx'
  ast: ASTNode
  functions: FunctionInfo[]
  functionCalls: FunctionCallInfo[]
  classes: ClassInfo[]
  variables: VariableInfo[]
  imports: ImportInfo[]
  exports: ExportInfo[]
  types: TypeInfo[]
}
