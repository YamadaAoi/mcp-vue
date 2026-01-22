<script lang="ts">
// Vue 3 Composition API with traditional setup() function (not <script setup>)
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  defineComponent,
  PropType
} from 'vue'

// Type definitions
interface Todo {
  id: number
  text: string
  completed: boolean
}

interface User {
  name: string
  role: string
  permissions: string[]
}

export default defineComponent({
  name: 'Vue3SetupFunction',

  // Props definition with traditional syntax
  props: {
    initialCount: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      default: 'Vue 3 Setup Function'
    },
    todos: {
      type: Array as PropType<Todo[]>,
      default: () => []
    },
    user: {
      type: Object as PropType<User>,
      default: () => ({
        name: 'Guest',
        role: 'user',
        permissions: ['read']
      })
    }
  },

  // Emits definition
  emits: ['update:count', 'todo-added', 'user-updated'],

  // Traditional setup function with function keyword
  setup(props, { emit }) {
    // Reactive state using ref
    const count = ref(props.initialCount)
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const newTodoText = ref('')
    const localTodos = ref([...props.todos])
    const currentUser = ref({ ...props.user })

    // Computed properties using function keyword
    const doubledCount = computed(function () {
      return count.value * 2
    })

    const completedTodosCount = computed(function () {
      return localTodos.value.filter(function (todo) {
        return todo.completed
      }).length
    })

    const hasAdminPermissions = computed(function () {
      return currentUser.value.permissions.includes('admin')
    })

    // Methods using function keyword syntax
    function increment() {
      count.value++
      emit('update:count', count.value)
    }

    function decrement() {
      count.value--
      emit('update:count', count.value)
    }

    function resetCount() {
      count.value = props.initialCount
      emit('update:count', count.value)
    }

    function addTodo() {
      if (newTodoText.value.trim() === '') {
        return
      }

      const newTodo: Todo = {
        id: Date.now(),
        text: newTodoText.value.trim(),
        completed: false
      }

      localTodos.value.push(newTodo)
      newTodoText.value = ''
      emit('todo-added', newTodo)
    }

    function toggleTodo(id: number) {
      const todo = localTodos.value.find(function (todo) {
        return todo.id === id
      })

      if (todo) {
        todo.completed = !todo.completed
      }
    }

    function updateUser(updates: Partial<User>) {
      currentUser.value = {
        ...currentUser.value,
        ...updates
      }
      emit('user-updated', currentUser.value)
    }

    // Async function with function keyword
    async function fetchData() {
      isLoading.value = true
      error.value = null

      try {
        // Simulate API call
        await new Promise(function (resolve) {
          setTimeout(resolve, 1000)
        })

        // Simulate successful data fetch
        updateUser({
          name: 'Fetched User',
          role: 'admin',
          permissions: ['read', 'write', 'admin']
        })
      } catch (err) {
        error.value = 'Failed to fetch data'
        console.error(err)
      } finally {
        isLoading.value = false
      }
    }

    // Lifecycle hooks with function keyword
    onMounted(function () {
      console.log('Component mounted with setup function')
      console.log('Initial props:', props)

      // Example of using a function inside lifecycle hook
      function setupInitialData() {
        console.log('Setting up initial data')
      }

      setupInitialData()
    })

    onUnmounted(function () {
      console.log('Component unmounted with setup function')
    })

    // Helper function defined inside setup
    function formatDate(date: Date) {
      return date.toLocaleDateString()
    }

    // Return all the properties and methods that should be available to the template
    return {
      // State
      count,
      isLoading,
      error,
      newTodoText,
      localTodos,
      currentUser,

      // Computed properties
      doubledCount,
      completedTodosCount,
      hasAdminPermissions,

      // Methods defined with function keyword
      increment,
      decrement,
      resetCount,
      addTodo,
      toggleTodo,
      updateUser,
      fetchData,

      // Helper functions
      formatDate,

      // Expose props for template access
      title: props.title
    }
  }
})
</script>

<template>
  <div class="setup-function-example">
    <h2>{{ title }}</h2>

    <div class="count-section">
      <p>Count: {{ count }}</p>
      <p>Doubled: {{ doubledCount }}</p>
      <div class="buttons">
        <button @click="increment">Increment</button>
        <button @click="decrement">Decrement</button>
        <button @click="resetCount">Reset</button>
      </div>
    </div>

    <div class="todo-section">
      <h3>
        Todos ({{ completedTodosCount }}/{{ localTodos.length }} completed)
      </h3>

      <div class="todo-input">
        <input
          v-model="newTodoText"
          placeholder="Add new todo"
          @keyup.enter="addTodo"
        />
        <button @click="addTodo" :disabled="!newTodoText.trim()">Add</button>
      </div>

      <ul class="todo-list">
        <li
          v-for="todo in localTodos"
          :key="todo.id"
          :class="{ completed: todo.completed }"
          @click="toggleTodo(todo.id)"
        >
          {{ todo.text }}
        </li>
      </ul>
    </div>

    <div class="user-section">
      <h3>User Info</h3>
      <p>Name: {{ currentUser.name }}</p>
      <p>Role: {{ currentUser.role }}</p>
      <p>Permissions: {{ currentUser.permissions.join(', ') }}</p>
      <p>Has Admin Access: {{ hasAdminPermissions ? 'Yes' : 'No' }}</p>

      <div class="data-fetch">
        <button @click="fetchData" :disabled="isLoading">
          {{ isLoading ? 'Loading...' : 'Fetch User Data' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
    </div>

    <div class="info-section">
      <p>Current Date: {{ formatDate(new Date()) }}</p>
    </div>
  </div>
</template>

<style scoped>
.setup-function-example {
  padding: 20px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  max-width: 800px;
  margin: 0 auto;
}

.count-section {
  margin-bottom: 20px;
}

.buttons button {
  margin-right: 10px;
  padding: 8px 12px;
  cursor: pointer;
}

.todo-section {
  margin-bottom: 20px;
}

.todo-input {
  margin-bottom: 10px;
}

.todo-input input {
  padding: 8px;
  margin-right: 5px;
  width: 200px;
}

.todo-list {
  list-style-type: none;
  padding: 0;
}

.todo-list li {
  padding: 8px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.todo-list li.completed {
  text-decoration: line-through;
  color: #888;
}

.user-section {
  margin-bottom: 20px;
}

.error {
  color: red;
  margin-top: 10px;
}

.data-fetch {
  margin-top: 10px;
}
</style>
