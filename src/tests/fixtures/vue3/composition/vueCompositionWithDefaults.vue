<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Type definitions for complex props
interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  fontSize: number
  notifications: {
    email: boolean
    push: boolean
    inApp: boolean
  }
}

interface Project {
  id: string
  name: string
  description: string
  tags: string[]
  metadata: Record<string, any>
}

interface TeamMember {
  id: number
  name: string
  role: string
  permissions: string[]
}

// Define props with complex default values using withDefaults
const props = withDefaults(
  defineProps<{
    // Basic prop with default
    title: string

    // Number with default
    initialCount?: number

    // Boolean with default
    isEnabled?: boolean

    // Array with complex objects as default
    teamMembers?: TeamMember[]

    // Object with nested structure as default
    preferences?: UserPreferences

    // Array of strings with default
    categories?: string[]

    // Object with simple key-value pairs
    config?: Record<string, any>

    // Single project object
    currentProject?: Project

    // Mixed type (could be string or array)
    searchTerms?: string | string[]

    // Function as default value
    onUpdate?: (value: any) => void
  }>(),
  {
    initialCount: 0,
    isEnabled: true,

    // Array with complex objects
    teamMembers: () => [
      {
        id: 1,
        name: 'Alice',
        role: 'Developer',
        permissions: ['read', 'write']
      },
      { id: 2, name: 'Bob', role: 'Designer', permissions: ['read'] },
      {
        id: 3,
        name: 'Charlie',
        role: 'Manager',
        permissions: ['read', 'write', 'admin']
      }
    ],

    // Object with nested structure
    preferences: () => ({
      theme: 'system',
      language: 'zh-CN',
      fontSize: 14,
      notifications: {
        email: true,
        push: false,
        inApp: true
      }
    }),

    // Array of primitive values
    categories: () => ['frontend', 'vue3', 'composition-api'],

    // Object with multiple properties
    config: () => ({
      debug: false,
      maxRetries: 3,
      timeout: 10000,
      cache: true
    }),

    // Complex object with nested arrays
    currentProject: () => ({
      id: 'default-project',
      name: 'Default Project',
      description: 'A default project created automatically',
      tags: ['default', 'demo', 'example'],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    }),

    // Mixed type default
    searchTerms: () => ['default', 'search', 'terms'],

    // Function default
    onUpdate: () => (value: any) =>
      console.log('Default update handler:', value)
  }
)

// Emits definition
const emit = defineEmits<{
  update: [value: number]
  submit: [data: FormData]
  reset: []
}>()

// Reactive state
const count = ref(props.initialCount)
const isEditing = ref(false)

// Computed properties using props with defaults
const totalTeamMembers = computed(() => props.teamMembers.length)
const hasAdminPermission = computed(() =>
  props.teamMembers.some(member => member.permissions.includes('admin'))
)
const activeNotificationTypes = computed(() =>
  Object.entries(props.preferences.notifications)
    .filter(([_, enabled]) => enabled)
    .map(([type]) => type)
)

// Methods
function incrementCount() {
  count.value++
  emit('update', count.value)
  props.onUpdate?.(count.value)
}

function addTeamMember(name: string, role: string) {
  const newMember: TeamMember = {
    id: Date.now(),
    name,
    role,
    permissions: ['read']
  }
  // Note: This creates a new array reference, which is the proper way to update arrays in props
  const updatedMembers = [...props.teamMembers, newMember]
  console.log('Updated team members:', updatedMembers)
}

// Lifecycle hook
onMounted(() => {
  console.log('Component mounted with props:', {
    teamMembers: props.teamMembers,
    preferences: props.preferences,
    categories: props.categories,
    config: props.config
  })
})
</script>

<template>
  <div class="with-defaults-example">
    <h2>{{ title }}</h2>

    <div class="count-section">
      <p>Count: {{ count }}</p>
      <button @click="incrementCount">Increment</button>
    </div>

    <div class="team-section">
      <h3>Team Members ({{ totalTeamMembers }})</h3>
      <ul>
        <li v-for="member in teamMembers" :key="member.id">
          {{ member.name }} - {{ member.role }}
          <span v-if="member.permissions.includes('admin')" class="admin-badge"
            >Admin</span
          >
        </li>
      </ul>
    </div>

    <div class="preferences-section">
      <h3>Preferences</h3>
      <p>Theme: {{ preferences.theme }}</p>
      <p>Language: {{ preferences.language }}</p>
      <p>Active Notifications: {{ activeNotificationTypes.join(', ') }}</p>
    </div>

    <div class="categories-section">
      <h3>Categories</h3>
      <div class="tags">
        <span v-for="category in categories" :key="category" class="tag">
          {{ category }}
        </span>
      </div>
    </div>

    <div class="config-section">
      <h3>Configuration</h3>
      <p>Debug: {{ config.debug }}</p>
      <p>Max Retries: {{ config.maxRetries }}</p>
      <p>Timeout: {{ config.timeout }}ms</p>
    </div>
  </div>
</template>

<style scoped>
.with-defaults-example {
  padding: 16px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
}

.count-section {
  margin-bottom: 16px;
}

.team-section {
  margin-bottom: 16px;
}

.admin-badge {
  background-color: #ff4444;
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
  margin-left: 8px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background-color: #e3f2fd;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  color: #1565c0;
}
</style>
