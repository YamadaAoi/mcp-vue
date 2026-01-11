<script lang="ts">
import { defineComponent } from 'vue'

// Type definitions for complex props
interface NotificationSettings {
  email: boolean
  push: boolean
  sms: boolean
}

interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  notifications: NotificationSettings
}

interface Permission {
  id: string
  name: string
  allowed: boolean
}

export default defineComponent({
  name: 'Vue3PropsDefaults',
  props: {
    // Array with complex objects as default
    userPermissions: {
      type: Array as () => Permission[],
      default: function () {
        return [
          { id: 'read', name: 'Read Access', allowed: true },
          { id: 'write', name: 'Write Access', allowed: true },
          { id: 'admin', name: 'Admin Access', allowed: false }
        ]
      }
    },
    // Object with nested structure as default
    userSettings: {
      type: Object as () => UserSettings,
      default: function () {
        return {
          theme: 'light',
          language: 'zh-CN',
          notifications: {
            email: true,
            push: false,
            sms: false
          }
        }
      }
    },
    // Array with primitive values as default
    tags: {
      type: Array as () => string[],
      default: function () {
        return ['vue3', 'options-api', 'props', 'defaults']
      }
    },
    // Object with simple key-value pairs
    configuration: {
      type: Object as () => Record<string, any>,
      default: function () {
        return {
          debug: false,
          maxItems: 100,
          timeout: 5000,
          cache: true
        }
      }
    },
    // Mixed types with function default
    flexibleProp: {
      type: [Object, Array, String],
      default: function () {
        return 'default-string'
      }
    },
    // Array of nested objects
    items: {
      type: Array as () => Array<{ id: number; name: string; details: object }>,
      default: function () {
        return [
          { id: 1, name: 'Item 1', details: { type: 'A' } },
          { id: 2, name: 'Item 2', details: { type: 'B' } }
        ]
      }
    },
    // Date object as default
    defaultDate: {
      type: Object as () => Date,
      default: function () {
        return new Date()
      }
    }
  },
  data() {
    return {
      localPermissions: [...this.userPermissions],
      localSettings: { ...this.userSettings },
      isEditing: false
    }
  },
  computed: {
    hasAdminAccess(): boolean {
      return this.localPermissions.some(
        perm => perm.id === 'admin' && perm.allowed
      )
    },
    activeNotificationsCount(): number {
      const settings = this.localSettings.notifications
      return Object.values(settings).filter(Boolean).length
    },
    tagsString(): string {
      return this.tags.join(', ')
    },
    hasComplexSettings(): boolean {
      return !!this.userSettings?.notifications?.email
    }
  },
  methods: {
    toggleAdminAccess(): void {
      const adminPerm = this.localPermissions.find(perm => perm.id === 'admin')
      if (adminPerm) {
        adminPerm.allowed = !adminPerm.allowed
      }
    },
    updateTheme(theme: 'light' | 'dark' | 'system'): void {
      this.localSettings.theme = theme
    },
    addTag(tag: string): void {
      if (!this.tags.includes(tag)) {
        this.tags.push(tag)
      }
    },
    resetToDefaults(): void {
      this.localPermissions = [...this.userPermissions]
      this.localSettings = { ...this.userSettings }
      this.isEditing = false
    }
  },
  mounted() {
    console.log('Vue 3 component mounted with props:', {
      permissions: this.userPermissions,
      settings: this.userSettings
    })
  },
  beforeUnmount() {
    console.log('Vue 3 component will unmount')
  }
})
</script>

<template>
  <div class="vue3-props-defaults">
    <h2>Vue 3 Props Defaults Example</h2>
    <div class="admin-access">
      <p>Admin Access: {{ hasAdminAccess ? 'Enabled' : 'Disabled' }}</p>
      <button @click="toggleAdminAccess">Toggle Admin Access</button>
    </div>
    <div class="notifications">
      <p>Active Notifications: {{ activeNotificationsCount }}</p>
    </div>
    <div class="tags">
      <p>Tags: {{ tagsString }}</p>
    </div>
    <div class="settings">
      <p>Theme: {{ localSettings.theme }}</p>
      <button @click="updateTheme('dark')">Set Dark Theme</button>
      <button @click="updateTheme('light')">Set Light Theme</button>
    </div>
    <div class="actions">
      <button @click="resetToDefaults">Reset to Defaults</button>
    </div>
  </div>
</template>
