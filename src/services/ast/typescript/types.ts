// 带位置信息的基础接口 - 数组格式 [startRow, startColumn, endRow, endColumn]
export interface Locatable {
  position: [number, number, number, number]
}

export interface ASTNode extends Locatable {
  type: string
  text: string
  children: ASTNode[]
}

export interface FunctionInfo extends Locatable {
  name: string
  type: string
  parameters: string[]
  returnType?: string
  isAsync: boolean
  isGenerator: boolean
}

export interface FunctionCallInfo extends Locatable {
  name: string
  arguments: string[]
}

export interface ClassInfo extends Locatable {
  name: string
  extends?: string
  implements?: string[]
  typeParameters?: string[]
  decorators?: string[]
  isAbstract: boolean
  methods: MethodInfo[]
  properties: PropertyInfo[]
  accessors?: AccessorInfo[]
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

export interface VariableInfo extends Locatable {
  name: string
  type?: string
  value?: string
  isConst: boolean
  isReadonly: boolean
  isExported: boolean
  scope?: 'local' | 'module' | 'global'
  decorators?: string[]
}

export interface ImportInfo extends Locatable {
  source: string
  imports: string[]
  isDefault: boolean
  isNamespace: boolean
  isTypeOnly: boolean
  isSideEffect: boolean
}

export interface ExportInfo extends Locatable {
  name: string
  type: 'function' | 'class' | 'variable' | 'type'
  isDefault: boolean
}

export interface TypeInfo extends Locatable {
  name: string
  kind: 'interface' | 'type' | 'enum' | 'class'
  properties: TypePropertyInfo[]
  methods: MethodInfo[]
  typeParameters?: string[]
  extends?: string[]
  typeBody?: string
  enumMembers?: string[]
}

export interface TypePropertyInfo {
  name: string
  type?: string
  isOptional: boolean
  isReadonly: boolean
}

export interface TsParseResult {
  language: 'typescript' | 'tsx' | 'javascript' | 'jsx'
  functions?: FunctionInfo[]
  functionCalls?: FunctionCallInfo[]
  classes?: ClassInfo[]
  variables?: VariableInfo[]
  imports?: ImportInfo[]
  exports?: ExportInfo[]
  types?: TypeInfo[]
}
