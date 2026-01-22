import type { Statement, ObjectExpression } from '@babel/types'

/**
 * 判断是否为Vue2选项式API编写的组件
 * @param fileContent Vue文件内容
 * @returns 如果确定是Vue2选项式API则返回true，否则返回false
 */
export function isVue2OptionsAPI(fileContent: string): boolean {
  const contentLower = fileContent.toLowerCase()

  if (
    contentLower.includes('<script setup') ||
    contentLower.includes('<script setup')
  ) {
    return false
  }

  if (contentLower.includes('definecomponent(')) {
    return false
  }

  const vue2LifecycleHooks = ['beforeDestroy', 'destroyed']

  const vue2SpecificFeatures = [
    'filters',
    '$set',
    '$delete',
    '$broadcast',
    '$dispatch',
    'Vue.extend'
  ]

  if (contentLower.includes('export default {')) {
    return true
  }

  for (const feature of vue2SpecificFeatures) {
    if (contentLower.includes(feature.toLowerCase())) {
      return true
    }
  }

  for (const hook of vue2LifecycleHooks) {
    if (contentLower.includes(hook.toLowerCase())) {
      return true
    }
  }

  return false
}

/**
 * 验证输入参数的有效性
 * @param code Vue组件代码
 * @param filename 文件名
 */
export function validateInput(code: string, filename: string): void {
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid code: code must be a non-empty string')
  }
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename: filename must be a non-empty string')
  }
}

/**
 * 检测是否是Vue Options API组件
 */
export function isOptionsAPIComponent(ast: Statement[]): boolean {
  const exportDefaultNode = ast.find(
    node => node.type === 'ExportDefaultDeclaration'
  )

  if (!exportDefaultNode) return false

  let componentOptions: ObjectExpression | null = null

  if (exportDefaultNode.declaration.type === 'ObjectExpression') {
    componentOptions = exportDefaultNode.declaration
  } else if (exportDefaultNode.declaration.type === 'CallExpression') {
    const callExpr = exportDefaultNode.declaration
    if (
      callExpr.callee.type === 'Identifier' &&
      callExpr.callee.name === 'defineComponent' &&
      callExpr.arguments.length > 0 &&
      callExpr.arguments[0].type === 'ObjectExpression'
    ) {
      componentOptions = callExpr.arguments[0]
    }
  }

  if (componentOptions) {
    const hasSetup = componentOptions.properties.some(prop => {
      if (prop.type !== 'ObjectProperty' && prop.type !== 'ObjectMethod')
        return false
      if (!('key' in prop)) return false
      const key = prop.key
      return (
        (key.type === 'Identifier' && key.name === 'setup') ||
        (key.type === 'StringLiteral' && key.value === 'setup')
      )
    })

    if (hasSetup) return false

    const hasOptionsAPIProps = componentOptions.properties.some(prop => {
      if (prop.type !== 'ObjectProperty' && prop.type !== 'ObjectMethod')
        return false
      if (!('key' in prop)) return false
      const key = prop.key
      const keyName =
        key.type === 'Identifier'
          ? key.name
          : key.type === 'StringLiteral'
            ? key.value
            : null
      if (!keyName) return false
      return [
        'data',
        'methods',
        'computed',
        'watch',
        'created',
        'mounted',
        'props',
        'emits'
      ].includes(keyName)
    })

    return hasOptionsAPIProps
  }

  return false
}

/**
 * 检测是否是Vue Composition API组件（包含setup函数）
 */
export function hasSetupFunction(ast: Statement[]): boolean {
  const exportDefaultNode = ast.find(
    node => node.type === 'ExportDefaultDeclaration'
  )

  if (!exportDefaultNode) {
    return false
  }

  let componentOptions: ObjectExpression | null = null

  if (exportDefaultNode.declaration.type === 'ObjectExpression') {
    componentOptions = exportDefaultNode.declaration
  } else if (exportDefaultNode.declaration.type === 'CallExpression') {
    const callExpr = exportDefaultNode.declaration
    if (
      callExpr.callee.type === 'Identifier' &&
      callExpr.callee.name === 'defineComponent' &&
      callExpr.arguments.length > 0 &&
      callExpr.arguments[0].type === 'ObjectExpression'
    ) {
      componentOptions = callExpr.arguments[0]
    }
  }

  if (!componentOptions) {
    return false
  }

  return componentOptions.properties.some(prop => {
    if (prop.type !== 'ObjectProperty' && prop.type !== 'ObjectMethod')
      return false

    if (!('key' in prop)) return false
    const key = prop.key
    return (
      (key.type === 'Identifier' && key.name === 'setup') ||
      (key.type === 'StringLiteral' && key.value === 'setup')
    )
  })
}
