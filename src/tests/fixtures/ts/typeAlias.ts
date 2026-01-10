type Status = 'active' | 'inactive' | 'pending'

type ApiResponse<T> = {
  data: T
  status: Status
  message?: string
}
