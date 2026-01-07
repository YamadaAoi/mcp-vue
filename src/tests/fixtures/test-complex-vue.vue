<template>
  <div class="user-list">
    <h2>User List</h2>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div v-for="user in users" :key="user.id" class="user-card">
        <h3>{{ user.name }}</h3>
        <p>Email: {{ user.email }}</p>
        <p>Role: {{ user.role }}</p>
        <button @click="editUser(user)">Edit</button>
        <button @click="deleteUser(user.id)">Delete</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
}

const users = ref<User[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const adminCount = computed(
  () => users.value.filter(u => u.role === 'admin').length
)

async function fetchUsers() {
  loading.value = true
  error.value = null
  try {
    const response = await fetch('/api/users')
    users.value = await response.json()
  } catch (err) {
    error.value = 'Failed to fetch users'
  } finally {
    loading.value = false
  }
}

function editUser(user: User) {
  console.log('Editing user:', user)
}

function deleteUser(id: number) {
  users.value = users.value.filter(u => u.id !== id)
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-list {
  padding: 20px;
}

.user-card {
  border: 1px solid #ccc;
  padding: 10px;
  margin: 10px 0;
}

.error {
  color: red;
}
</style>
