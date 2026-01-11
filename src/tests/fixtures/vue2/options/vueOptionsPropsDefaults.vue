<script>
// Vue 2.7 Options API with comprehensive prop default values
export default {
  name: 'Vue27PropsDefaults',
  // Comprehensive props with default values returning objects and arrays
  props: {
    // Array with complex default value
    complexArray: {
      type: Array,
      default: function () {
        return [
          { id: 1, name: 'Item 1', active: true },
          { id: 2, name: 'Item 2', active: false }
        ]
      }
    },
    // Object with nested structure as default
    nestedObject: {
      type: Object,
      default: function () {
        return {
          settings: {
            theme: 'light',
            language: 'en-US',
            notifications: {
              email: true,
              push: false
            }
          },
          permissions: ['read', 'write'],
          metadata: {
            createdAt: new Date().toISOString(),
            version: '1.0.0'
          }
        }
      }
    },
    // Basic array default
    simpleArray: {
      type: Array,
      default: function () {
        return ['default', 'values']
      }
    },
    // Basic object default
    simpleObject: {
      type: Object,
      default: function () {
        return { key: 'value' }
      }
    },
    // Mixed types with defaults
    mixedProps: {
      type: [Object, Array],
      default: function () {
        return {}
      }
    },
    // Boolean with function default
    flag: {
      type: Boolean,
      default: function () {
        return true
      }
    }
  },
  // Data with references to props
  data() {
    return {
      localArray: [...this.complexArray],
      localObject: { ...this.nestedObject },
      isModified: false
    }
  },
  // Methods to modify props defaults
  methods: {
    updateArray() {
      this.localArray.push({ id: Date.now(), name: 'New Item', active: true })
      this.isModified = true
    },
    updateObject() {
      this.localObject.settings.theme = 'dark'
      this.isModified = true
    },
    resetToDefaults() {
      this.localArray = [...this.complexArray]
      this.localObject = { ...this.nestedObject }
      this.isModified = false
    }
  },
  // Computed properties using prop defaults
  computed: {
    activeItemsCount() {
      return this.localArray.filter(item => item.active).length
    },
    hasComplexSettings() {
      return (
        this.localObject.settings &&
        this.localObject.settings.notifications &&
        Object.keys(this.localObject.settings.notifications).length > 0
      )
    },
    isDefaultTheme() {
      return (
        this.localObject.settings.theme === this.nestedObject.settings.theme
      )
    }
  },
  // Lifecycle hooks
  created() {
    console.log('Component created with default props:', {
      complexArray: this.complexArray,
      nestedObject: this.nestedObject
    })
  }
}
</script>

<template>
  <div class="props-defaults">
    <h2>Prop Defaults Example</h2>
    <div v-if="isModified" class="modified-indicator">
      Data has been modified from defaults
    </div>
    <div class="stats">
      <p>Active Items: {{ activeItemsCount }}</p>
      <p>Has Complex Settings: {{ hasComplexSettings }}</p>
      <p>Default Theme: {{ isDefaultTheme }}</p>
    </div>
    <div class="actions">
      <button @click="updateArray">Add Array Item</button>
      <button @click="updateObject">Change Theme</button>
      <button @click="resetToDefaults">Reset to Defaults</button>
    </div>
  </div>
</template>
