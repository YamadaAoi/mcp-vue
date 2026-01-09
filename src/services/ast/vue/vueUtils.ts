import { parse as parseSFC } from '@vue/compiler-sfc'
import { getLogger } from '../../../utils/logger'

const logger = getLogger()

export type VueComponentType =
  | 'vue3-composition'
  | 'vue3-options'
  | 'vue2-options'
  | 'unknown'

export interface VueComponentTypeInfo {
  type: VueComponentType
  hasScriptSetup: boolean
  hasScript: boolean
  features: {
    hasCompositionAPI: boolean
    hasOptionsAPI: boolean
    hasVue2Specific: boolean
    hasVue3Specific: boolean
  }
}

const VUE2_SPECIFIC_FEATURES = new Set([
  'beforeDestroy',
  'destroyed',
  'filters',
  'v-model',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeCreate',
  'created'
])

const VUE3_SPECIFIC_FEATURES = new Set([
  'beforeUnmount',
  'unmounted',
  'setup',
  'defineComponent',
  'defineProps',
  'defineEmits',
  'defineExpose',
  'defineOptions',
  'defineSlots',
  'useSlots',
  'useAttrs',
  'useCssModule',
  'useCssVars',
  'inject',
  'provide',
  'onMounted',
  'onUpdated',
  'onUnmounted',
  'onBeforeMount',
  'onBeforeUpdate',
  'onBeforeUnmount',
  'onErrorCaptured',
  'onRenderTracked',
  'onRenderTriggered',
  'onActivated',
  'onDeactivated',
  'onServerPrefetch'
])

function detectVue2SpecificFeatures(scriptContent: string): boolean {
  const lowerContent = scriptContent.toLowerCase()

  for (const feature of VUE2_SPECIFIC_FEATURES) {
    if (lowerContent.includes(feature.toLowerCase())) {
      return true
    }
  }

  return false
}

function detectVue3SpecificFeatures(scriptContent: string): boolean {
  const lowerContent = scriptContent.toLowerCase()

  for (const feature of VUE3_SPECIFIC_FEATURES) {
    if (lowerContent.includes(feature.toLowerCase())) {
      return true
    }
  }

  return false
}

function detectCompositionAPI(scriptContent: string): boolean {
  const lowerContent = scriptContent.toLowerCase()

  const compositionPatterns = [
    'setup(',
    'defineprops',
    'defineemits',
    'defineexpose',
    'ref(',
    'reactive(',
    'computed(',
    'watch(',
    'watcheffect(',
    'onmounted',
    'onupdated',
    'onunmounted',
    'usestate',
    'useeffect',
    'usecontext',
    'usereducer',
    'usecallback',
    'usememo',
    'useref'
  ]

  for (const pattern of compositionPatterns) {
    if (lowerContent.includes(pattern)) {
      return true
    }
  }

  return false
}

function detectOptionsAPI(scriptContent: string): boolean {
  const lowerContent = scriptContent.toLowerCase()

  const optionsPatterns = [
    'data(',
    'computed:',
    'methods:',
    'watch:',
    'props:',
    'components:',
    'directives:',
    'filters:',
    'mixins:',
    'extends:',
    'provide:',
    'inject:',
    'name:',
    'inheritattrs:',
    'delimiters:',
    'functional:',
    'model:',
    'render(',
    'template:',
    'beforecreate',
    'created',
    'beforemount',
    'mounted',
    'beforeupdate',
    'updated',
    'beforedestroy',
    'destroyed',
    'beforeunmount',
    'unmounted',
    'activated',
    'deactivated',
    'errorcaptured',
    'rendertracked',
    'rendertriggered'
  ]

  for (const pattern of optionsPatterns) {
    if (lowerContent.includes(pattern)) {
      return true
    }
  }

  return false
}

export function detectVueComponentType(
  code: string,
  filename: string
): VueComponentTypeInfo {
  logger.debug(`Detecting Vue component type for: ${filename}`)

  try {
    const { descriptor } = parseSFC(code, { filename })

    const hasScriptSetup = !!descriptor.scriptSetup
    const hasScript = !!descriptor.script

    const scriptContent =
      descriptor.scriptSetup?.content || descriptor.script?.content || ''

    const hasCompositionAPI = detectCompositionAPI(scriptContent)
    const hasOptionsAPI = detectOptionsAPI(scriptContent)
    const hasVue2Specific = detectVue2SpecificFeatures(scriptContent)
    const hasVue3Specific = detectVue3SpecificFeatures(scriptContent)

    let type: VueComponentType = 'unknown'

    if (hasScriptSetup) {
      type = 'vue3-composition'
    } else if (hasScript) {
      if (hasVue2Specific) {
        type = 'vue2-options'
      } else if (hasVue3Specific || hasOptionsAPI) {
        type = 'vue3-options'
      } else if (hasCompositionAPI) {
        type = 'vue3-composition'
      } else {
        type = 'vue3-options'
      }
    }

    const result: VueComponentTypeInfo = {
      type,
      hasScriptSetup,
      hasScript,
      features: {
        hasCompositionAPI,
        hasOptionsAPI,
        hasVue2Specific,
        hasVue3Specific
      }
    }

    logger.debug(`Detected Vue component type for ${filename}`, {
      type,
      hasScriptSetup,
      hasScript,
      features: result.features
    })

    return result
  } catch (error) {
    logger.error(`Failed to detect Vue component type for ${filename}:`, error)

    return {
      type: 'unknown',
      hasScriptSetup: false,
      hasScript: false,
      features: {
        hasCompositionAPI: false,
        hasOptionsAPI: false,
        hasVue2Specific: false,
        hasVue3Specific: false
      }
    }
  }
}

export function isVue3Composition(typeInfo: VueComponentTypeInfo): boolean {
  return typeInfo.type === 'vue3-composition'
}

export function isVue3Options(typeInfo: VueComponentTypeInfo): boolean {
  return typeInfo.type === 'vue3-options'
}

export function isVue2Options(typeInfo: VueComponentTypeInfo): boolean {
  return typeInfo.type === 'vue2-options'
}

export function getVueComponentTypeDescription(
  typeInfo: VueComponentTypeInfo
): string {
  switch (typeInfo.type) {
    case 'vue3-composition':
      return 'Vue 3 Composition API with <script setup>'
    case 'vue3-options':
      return 'Vue 3 Options API'
    case 'vue2-options':
      return 'Vue 2 Options API'
    default:
      return 'Unknown Vue component type'
  }
}
