export function greet(name: string): string {
  return `Hello, ${name}!`
}

export function add(a: number, b: number): number {
  return a + b
}

export function multiply(a: number, b: number): number {
  return a * b
}

interface User {
  id: number
  name: string
  email: string
}

type UserRole = 'admin' | 'user' | 'guest'

const MAX_USERS = 100
let currentUserCount = 0

export function createUser(name: string, email: string): User {
  if (currentUserCount >= MAX_USERS) {
    throw new Error('Maximum users reached')
  }

  const user: User = {
    id: currentUserCount++,
    name,
    email
  }

  return user
}

export function getUserRole(user: User): UserRole {
  return user.id === 0 ? 'admin' : 'user'
}
