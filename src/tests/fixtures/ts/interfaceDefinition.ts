interface User {
  id: number
  name: string
  email?: string
  readonly createdAt: Date
}

interface Admin extends User {
  permissions: string[]
}
