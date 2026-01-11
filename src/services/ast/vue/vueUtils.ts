/**
 * 判断是否为Vue2选项式API编写的组件
 * @param fileContent Vue文件内容
 * @returns 如果确定是Vue2选项式API则返回true，否则返回false
 */
export function isVue2OptionsAPI(fileContent: string): boolean {
  // 转换为小写以进行不区分大小写的检查
  const contentLower = fileContent.toLowerCase()

  // 检测是否使用了script setup
  if (
    contentLower.includes('<script setup') ||
    contentLower.includes('<script setup')
  ) {
    return false
  }

  // 检测是否使用了Vue 3的defineComponent调用
  if (contentLower.includes('definecomponent(')) {
    return false
  }

  // Vue2特有的生命周期钩子
  const vue2LifecycleHooks = ['beforeDestroy', 'destroyed']

  // Vue2特有的功能
  const vue2SpecificFeatures = [
    'filters',
    '$set',
    '$delete',
    '$broadcast',
    '$dispatch',
    'Vue.extend'
  ]

  // 检查是否使用了Vue 2的export default {}语法（而不是defineComponent）
  if (contentLower.includes('export default {')) {
    // 这是一个Vue 2组件（可能是Options API或Composition API）
    return true
  }

  // 检查是否包含Vue2特有特征
  for (const feature of vue2SpecificFeatures) {
    if (contentLower.includes(feature.toLowerCase())) {
      return true
    }
  }

  // 检查是否包含Vue2生命周期钩子
  for (const hook of vue2LifecycleHooks) {
    if (contentLower.includes(hook.toLowerCase())) {
      return true
    }
  }

  // 默认返回false（如果无法确定，则视为Vue3）
  return false
}
