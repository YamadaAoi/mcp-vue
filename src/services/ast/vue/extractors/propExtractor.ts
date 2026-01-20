import type {
  Statement,
  CallExpression,
  ObjectExpression,
  ObjectProperty,
  TSTypeLiteral,
  TSTypeAnnotation,
  StringLiteral,
  NumericLiteral,
  BooleanLiteral,
  VariableDeclaration,
  ExpressionStatement,
  Identifier
} from '@babel/types'
import type { PropInfo, PropDefault } from '../types'
import { getLocationFromNode } from './extractUtil'

const PROP_CONFIG_KEYS = {
  TYPE: 'type',
  DEFAULT: 'default',
  REQUIRED: 'required',
  VALIDATOR: 'validator',
  MODEL: 'model',
  SLOTS: 'slots'
} as const

const VUE_COMPOSITION_FUNCTIONS = {
  DEFINE_PROPS: 'defineProps',
  WITH_DEFAULTS: 'withDefaults',
  DEFINE_COMPONENT: 'defineComponent'
} as const

const MODEL_PROP_PREFIXES = ['modelValue', 'model']

function isObjectPropertyWithIdentifierKey(
  node: unknown
): node is ObjectProperty & { key: Identifier } {
  if (!node || typeof node !== 'object') return false
  const prop = node as { type?: string; key?: { type?: string; name?: string } }
  return (
    prop.type === 'ObjectProperty' &&
    prop.key?.type === 'Identifier' &&
    typeof prop.key.name === 'string'
  )
}

function isIdentifierWithName(name: string) {
  return function (node: unknown): node is Identifier {
    if (!node || typeof node !== 'object') return false
    const ident = node as { type?: string; name?: string }
    return ident.type === 'Identifier' && ident.name === name
  }
}

/**
 * 解析 Prop 默认值
 * @param valueProp 默认值属性
 * @returns 解析后的默认值信息
 */
function parsePropDefault(valueProp: ObjectProperty): PropDefault | undefined {
  if (!valueProp.value) return undefined

  const value = valueProp.value

  // 原始值类型
  if (
    value.type === 'StringLiteral' ||
    value.type === 'NumericLiteral' ||
    value.type === 'BooleanLiteral' ||
    value.type === 'NullLiteral'
  ) {
    return {
      type: 'primitive',
      value: (value as StringLiteral | NumericLiteral | BooleanLiteral).value
    }
  }

  // 数组类型
  if (value.type === 'ArrayExpression') {
    return {
      type: 'array',
      isFactory: true,
      factoryExpression: '() => []'
    }
  }

  // 对象类型
  if (value.type === 'ObjectExpression') {
    return {
      type: 'object',
      isFactory: true,
      factoryExpression: '() => ({})'
    }
  }

  // 函数类型（工厂函数）
  if (
    value.type === 'FunctionExpression' ||
    value.type === 'ArrowFunctionExpression'
  ) {
    return {
      type: 'function',
      isFactory: true,
      factoryExpression: '() => default'
    }
  }

  // 标识符（可能是变量引用）
  if (value.type === 'Identifier') {
    return {
      type: 'expression',
      value: value.name
    }
  }

  return undefined
}

/**
 * 解析 Prop 类型
 * @param typeProp 类型属性
 * @returns 解析后的类型字符串
 */
function parsePropType(typeProp: ObjectProperty): string | undefined {
  if (!typeProp.value) return undefined

  const value = typeProp.value

  // 数组类型 [String, Number]
  if (value.type === 'ArrayExpression') {
    const types: string[] = []
    for (const element of value.elements) {
      if (element && element.type === 'Identifier') {
        types.push(element.name)
      }
    }
    return types.length > 0 ? types.join(' | ') : undefined
  }

  // 单个类型 String
  if (value.type === 'Identifier') {
    return value.name
  }

  return undefined
}

/**
 * 从 TypeScript 类型注解中解析类型
 * @param typeAnnotation 类型注解
 * @returns 解析后的类型字符串
 */
function parseTypeFromAnnotation(typeAnnotation: TSTypeAnnotation): string {
  const type = typeAnnotation.typeAnnotation

  // 基本类型
  if (type.type === 'TSStringKeyword') return 'string'
  if (type.type === 'TSNumberKeyword') return 'number'
  if (type.type === 'TSBooleanKeyword') return 'boolean'
  if (type.type === 'TSNullKeyword') return 'null'
  if (type.type === 'TSUndefinedKeyword') return 'undefined'
  if (type.type === 'TSAnyKeyword') return 'any'
  if (type.type === 'TSUnknownKeyword') return 'unknown'
  if (type.type === 'TSVoidKeyword') return 'void'
  if (type.type === 'TSNeverKeyword') return 'never'

  // 数组类型
  if (type.type === 'TSArrayType') {
    const elementType = parseTypeFromAnnotation({
      typeAnnotation: type.elementType
    } as TSTypeAnnotation)
    return `${elementType}[]`
  }

  // 联合类型
  if (type.type === 'TSUnionType') {
    const types = type.types.map(t =>
      parseTypeFromAnnotation({ typeAnnotation: t } as TSTypeAnnotation)
    )
    return types.join(' | ')
  }

  // 字面量类型
  if (type.type === 'TSLiteralType') {
    const literal = type.literal
    if (literal.type === 'StringLiteral') return `'${literal.value}'`
    if (literal.type === 'NumericLiteral') return String(literal.value)
    if (literal.type === 'BooleanLiteral') return String(literal.value)
  }

  // 类型引用
  if (type.type === 'TSTypeReference') {
    if (type.typeName.type === 'Identifier') {
      return type.typeName.name
    }
  }

  return 'unknown'
}

/**
 * 从 TypeScript 类型字面量中提取 Props
 * @param typeLiteral 类型字面量
 * @returns Props 信息数组
 */
function extractPropsFromTSTypeLiteral(typeLiteral: TSTypeLiteral): PropInfo[] {
  const props: PropInfo[] = []

  for (const member of typeLiteral.members) {
    if (member.type === 'TSPropertySignature') {
      const propMember = member

      if (propMember.key.type === 'Identifier') {
        const propName = propMember.key.name
        const propType = propMember.typeAnnotation
          ? parseTypeFromAnnotation(propMember.typeAnnotation)
          : undefined

        const isOptional = propMember.optional || false

        props.push({
          name: propName,
          type: propType,
          required: !isOptional,
          position: getLocationFromNode(propMember)
        })
      }
    }
  }

  return props
}

function extractPropsFromDefinePropsCall(callExpr: CallExpression): PropInfo[] {
  const props: PropInfo[] = []

  if (callExpr.typeParameters) {
    const typeParams = callExpr.typeParameters
    if (
      typeParams.type === 'TSTypeParameterInstantiation' &&
      typeParams.params.length > 0
    ) {
      const firstParam = typeParams.params[0]
      if (firstParam.type === 'TSTypeLiteral') {
        const extractedProps = extractPropsFromTSTypeLiteral(firstParam)

        if (callExpr.arguments.length > 1) {
          const defaultsArg = callExpr.arguments[1]
          if (defaultsArg.type === 'ObjectExpression') {
            return mergePropsWithDefaults(extractedProps, defaultsArg)
          }
        }

        return extractedProps
      }
    }
  }

  if (callExpr.arguments.length === 0) return props

  const arg = callExpr.arguments[0]

  if (arg.type === 'ObjectExpression') {
    return extractPropsFromObjectExpression(arg)
  }

  return props
}

function extractPropsFromWithDefaults(
  withDefaultsCall: CallExpression
): PropInfo[] {
  if (withDefaultsCall.arguments.length < 2) return []

  const definePropsCall = withDefaultsCall.arguments[0]
  const defaultsArg = withDefaultsCall.arguments[1]

  if (
    definePropsCall.type === 'CallExpression' &&
    isIdentifierWithName(VUE_COMPOSITION_FUNCTIONS.DEFINE_PROPS)(
      definePropsCall.callee
    )
  ) {
    let extractedProps: PropInfo[] = []

    if (definePropsCall.typeParameters) {
      const typeParams = definePropsCall.typeParameters
      if (
        typeParams.type === 'TSTypeParameterInstantiation' &&
        typeParams.params.length > 0
      ) {
        const firstParam = typeParams.params[0]
        if (firstParam.type === 'TSTypeLiteral') {
          extractedProps = extractPropsFromTSTypeLiteral(firstParam)
        }
      }
    }

    if (defaultsArg.type === 'ObjectExpression') {
      extractedProps = mergePropsWithDefaults(extractedProps, defaultsArg)
    }

    return extractedProps
  }

  return []
}

function extractPropsFromVariableDeclaration(
  node: VariableDeclaration
): PropInfo[] {
  const props: PropInfo[] = []

  for (const declarator of node.declarations) {
    if (!declarator.init) continue

    const init = declarator.init

    if (
      init.type === 'CallExpression' &&
      isIdentifierWithName(VUE_COMPOSITION_FUNCTIONS.WITH_DEFAULTS)(init.callee)
    ) {
      const extractedProps = extractPropsFromWithDefaults(init)
      props.push(...extractedProps)
    }

    if (
      init.type === 'CallExpression' &&
      isIdentifierWithName(VUE_COMPOSITION_FUNCTIONS.DEFINE_PROPS)(init.callee)
    ) {
      const extractedProps = extractPropsFromDefinePropsCall(init)
      props.push(...extractedProps)
    }
  }

  return props
}

function extractPropsFromExpressionStatement(
  node: ExpressionStatement
): PropInfo[] {
  if (node.expression.type !== 'CallExpression') return []

  const callExpr = node.expression

  if (
    isIdentifierWithName(VUE_COMPOSITION_FUNCTIONS.DEFINE_PROPS)(
      callExpr.callee
    )
  ) {
    return extractPropsFromDefinePropsCall(callExpr)
  }

  return []
}

function extractPropsFromExportDefaultDeclaration(node: Statement): PropInfo[] {
  if (node.type !== 'ExportDefaultDeclaration') return []

  const exportDecl = node

  if (exportDecl.declaration.type === 'ObjectExpression') {
    return extractPropsFromOptionsAPI(exportDecl.declaration)
  }

  if (exportDecl.declaration.type === 'CallExpression') {
    const callExpr = exportDecl.declaration

    if (
      isIdentifierWithName(VUE_COMPOSITION_FUNCTIONS.DEFINE_COMPONENT)(
        callExpr.callee
      ) &&
      callExpr.arguments.length > 0 &&
      callExpr.arguments[0].type === 'ObjectExpression'
    ) {
      return extractPropsFromOptionsAPI(callExpr.arguments[0])
    }
  }

  return []
}

export function extractProps(ast: Statement[]): PropInfo[] {
  const props: PropInfo[] = []

  for (const node of ast) {
    if (node.type === 'VariableDeclaration') {
      const extractedProps = extractPropsFromVariableDeclaration(node)
      props.push(...extractedProps)
    }

    if (node.type === 'ExpressionStatement') {
      const extractedProps = extractPropsFromExpressionStatement(node)
      props.push(...extractedProps)
    }

    if (node.type === 'ExportDefaultDeclaration') {
      const extractedProps = extractPropsFromExportDefaultDeclaration(node)
      props.push(...extractedProps)
    }
  }

  return props
}

/**
 * 合并 Props 定义和默认值
 * @param props Props 信息数组
 * @param defaultsExpr 默认值对象表达式
 * @returns 合并后的 Props 信息数组
 */
function mergePropsWithDefaults(
  props: PropInfo[],
  defaultsExpr: ObjectExpression
): PropInfo[] {
  const defaultsMap = new Map<string, PropDefault>()

  for (const prop of defaultsExpr.properties) {
    if (isObjectPropertyWithIdentifierKey(prop)) {
      const defaultValue = parsePropDefault(prop)
      if (defaultValue) {
        defaultsMap.set(prop.key.name, defaultValue)
      }
    }
  }

  return props.map(prop => {
    const defaultValue = defaultsMap.get(prop.name)
    if (defaultValue) {
      return {
        ...prop,
        default: defaultValue
      }
    }
    return prop
  })
}

function parsePropConfig(configObj: ObjectExpression): {
  type?: string
  default?: PropDefault
  required: boolean
  validator: boolean
  validatorExpression?: string
  isModelProp: boolean
  isSlotsProp: boolean
} {
  let propType: string | undefined = undefined
  let propDefault: PropDefault | undefined = undefined
  let required = false
  let validator = false
  let validatorExpression: string | undefined = undefined
  let isModelProp = false
  let isSlotsProp = false

  for (const configProp of configObj.properties) {
    if (!isObjectPropertyWithIdentifierKey(configProp)) continue

    const configKey = configProp.key.name

    if (configKey === PROP_CONFIG_KEYS.TYPE) {
      propType = parsePropType(configProp)
    }

    if (configKey === PROP_CONFIG_KEYS.DEFAULT) {
      propDefault = parsePropDefault(configProp)
    }

    if (
      configKey === PROP_CONFIG_KEYS.REQUIRED &&
      configProp.value.type === 'BooleanLiteral'
    ) {
      required = configProp.value.value
    }

    if (configKey === PROP_CONFIG_KEYS.VALIDATOR) {
      validator = true
      validatorExpression = 'validator function'
    }

    if (
      configKey === PROP_CONFIG_KEYS.MODEL &&
      configProp.value.type === 'BooleanLiteral'
    ) {
      isModelProp = configProp.value.value
    }

    if (
      configKey === PROP_CONFIG_KEYS.SLOTS &&
      configProp.value.type === 'BooleanLiteral'
    ) {
      isSlotsProp = configProp.value.value
    }
  }

  return {
    type: propType,
    default: propDefault,
    required,
    validator,
    validatorExpression,
    isModelProp,
    isSlotsProp
  }
}

function isModelPropName(propName: string): boolean {
  return MODEL_PROP_PREFIXES.some(prefix => propName.startsWith(prefix))
}

function extractPropsFromObjectExpression(
  objExpr: ObjectExpression
): PropInfo[] {
  const props: PropInfo[] = []

  for (const prop of objExpr.properties) {
    if (!isObjectPropertyWithIdentifierKey(prop)) continue

    const propName = prop.key.name
    let propType: string | undefined = undefined
    let propDefault: PropDefault | undefined = undefined
    let required = false
    let validator = false
    let validatorExpression: string | undefined = undefined
    let isModelProp = false
    let isSlotsProp = false

    if (prop.value.type === 'ObjectExpression') {
      const config = parsePropConfig(prop.value)
      propType = config.type
      propDefault = config.default
      required = config.required
      validator = config.validator
      validatorExpression = config.validatorExpression
      isModelProp = config.isModelProp
      isSlotsProp = config.isSlotsProp
    } else {
      propType = parsePropType(prop)
      required = true
    }

    if (isModelPropName(propName)) {
      isModelProp = true
    }

    if (propName === PROP_CONFIG_KEYS.SLOTS) {
      isSlotsProp = true
    }

    props.push({
      name: propName,
      type: propType,
      default: propDefault,
      required,
      validator,
      validatorExpression,
      isModelProp,
      isSlotsProp,
      position: getLocationFromNode(prop)
    })
  }

  return props
}

function extractPropsFromOptionsAPI(objExpr: ObjectExpression): PropInfo[] {
  for (const prop of objExpr.properties) {
    if (isObjectPropertyWithIdentifierKey(prop) && prop.key.name === 'props') {
      if (prop.value.type === 'ObjectExpression') {
        return extractPropsFromObjectExpression(prop.value)
      }
    }
  }

  return []
}
