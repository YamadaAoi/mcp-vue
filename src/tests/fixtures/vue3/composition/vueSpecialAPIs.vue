<script setup lang="ts">
// Vue 3 Composition API with special APIs: provide/inject, useAttrs, useSlots, defineExpose
import {
  ref,
  computed,
  provide,
  inject,
  onMounted,
  useAttrs,
  useSlots,
  defineExpose
} from 'vue'

// Define injection keys for type safety
const THEME_KEY = Symbol('theme')
const COUNTER_KEY = Symbol('counter')
const USER_KEY = Symbol('user')

// Type definitions for injected values
interface ThemeConfig {
  theme: 'light' | 'dark' | 'system'
  toggleTheme: () => void
  isDarkMode: boolean
}

interface CounterStore {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

interface User {
  name: string
  role: string
  updateRole: (role: string) => void
}

// Parent component logic with provide
const theme = ref<'light' | 'dark' | 'system'>('light')
const isDarkMode = computed(() => theme.value === 'dark')

const count = ref(0)
const user = ref<User>({
  name: 'Admin User',
  role: 'admin',
  updateRole: function (newRole: string) {
    this.role = newRole
  }
})

// Methods using function keyword
function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

function increment() {
  count.value++
}

function decrement() {
  count.value--
}

function reset() {
  count.value = 0
}

// Provide values to child components
provide<ThemeConfig>(THEME_KEY, {
  theme: theme.value,
  toggleTheme,
  isDarkMode: isDarkMode.value
})

provide<CounterStore>(COUNTER_KEY, {
  count: count.value,
  increment,
  decrement,
  reset
})

provide<User>(USER_KEY, user.value)

// Use other special APIs
const attrs = useAttrs()
const slots = useSlots()

// Expose some properties to parent components
// Note: This is more useful when using ref template refs
defineExpose({
  count,
  theme,
  toggleTheme,
  increment,
  decrement,
  reset
})

// Lifecycle hook
onMounted(() => {
  console.log('Parent component mounted')
  console.log('Provided values:', {
    theme: theme.value,
    count: count.value,
    user: user.value
  })
})
</script>

<!-- Child component that uses inject -->
<script setup lang="ts">
// Child component using inject API
import { computed } from 'vue'

// Reuse injection keys and types from parent
const THEME_KEY = Symbol('theme')
const COUNTER_KEY = Symbol('counter')
const USER_KEY = Symbol('user')

interface ThemeConfig {
  theme: 'light' | 'dark' | 'system'
  toggleTheme: () => void
  isDarkMode: boolean
}

interface CounterStore {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

interface User {
  name: string
  role: string
  updateRole: (role: string) => void
}

// Inject values from parent component
// Use function keyword for computed
const themeConfig = inject<ThemeConfig>(THEME_KEY)
const counterStore = inject<CounterStore>(COUNTER_KEY)
const user = inject<User>(USER_KEY)

// Computed properties in child component
const displayCount = computed(function () {
  return counterStore ? `Count: ${counterStore.count}` : 'Count: N/A'
})

const displayUser = computed(function () {
  return user ? `${user.name} (${user.role})` : 'User: N/A'
})

const canAccessAdmin = computed(function () {
  return user ? user.role === 'admin' : false
})

// Method to update user role
function promoteToAdmin() {
  if (user) {
    user.updateRole('admin')
  }
}

function demoteToUser() {
  if (user) {
    user.updateRole('user')
  }
}
</script>

<template>
  <div class="special-apis-example" :class="{ 'dark-theme': isDarkMode }">
    <h1>Vue 3 Special APIs Example</h1>

    <!-- Parent component section -->
    <div class="parent-section">
      <h2>Parent Component (Provide)</h2>

      <div class="theme-section">
        <p>Current Theme: {{ theme }}</p>
        <p>Is Dark Mode: {{ isDarkMode }}</p>
        <button @click="toggleTheme">Toggle Theme</button>
      </div>

      <div class="counter-section">
        <p>Count: {{ count }}</p>
        <div class="buttons">
          <button @click="increment">Increment</button>
          <button @click="decrement">Decrement</button>
          <button @click="reset">Reset</button>
        </div>
      </div>

      <div class="user-section">
        <p>User: {{ user.name }}</p>
        <p>Role: {{ user.role }}</p>
        <div class="buttons">
          <button @click="user.updateRole('admin')">Set Admin</button>
          <button @click="user.updateRole('user')">Set User</button>
        </div>
      </div>

      <div class="attrs-slots-section">
        <h3>useAttrs & useSlots</h3>
        <p>Attrs: {{ attrs }}</p>
        <p>Has Default Slot: {{ !!slots.default }}</p>
      </div>
    </div>

    <!-- Child component section -->
    <div class="child-section">
      <h2>Child Component (Inject)</h2>

      <div class="injected-theme">
        <p>Injected Theme: {{ themeConfig?.theme }}</p>
        <button @click="themeConfig?.toggleTheme">
          Toggle Theme (Injected)
        </button>
      </div>

      <div class="injected-counter">
        <p>{{ displayCount }}</p>
        <div class="buttons">
          <button @click="counterStore?.increment">Increment (Injected)</button>
          <button @click="counterStore?.decrement">Decrement (Injected)</button>
          <button @click="counterStore?.reset">Reset (Injected)</button>
        </div>
      </div>

      <div class="injected-user">
        <p>{{ displayUser }}</p>
        <p>Can Access Admin: {{ canAccessAdmin }}</p>
        <div class="buttons">
          <button @click="promoteToAdmin">Promote to Admin</button>
          <button @click="demoteToUser">Demote to User</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.special-apis-example {
  padding: 20px;
  font-family: Arial, sans-serif;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.dark-theme {
  background-color: #333;
  color: white;
}

.parent-section,
.child-section {
  border: 1px solid #eaeaea;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 8px;
}

.dark-theme .parent-section,
.dark-theme .child-section {
  border-color: #555;
}

.theme-section,
.counter-section,
.user-section,
.injected-theme,
.injected-counter,
.injected-user {
  margin-bottom: 15px;
}

.buttons {
  margin-top: 10px;
}

button {
  margin-right: 5px;
  padding: 8px 12px;
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  color: #333;
}

.dark-theme button {
  background-color: #555;
  color: white;
  border-color: #777;
}

button:hover {
  opacity: 0.9;
}

.attrs-slots-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.dark-theme .attrs-slots-section {
  border-top-color: #555;
}

p {
  margin: 5px 0;
}
</style>
