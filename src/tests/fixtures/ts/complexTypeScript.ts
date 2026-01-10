interface Repository<T> {
  findById(id: number): Promise<T | null>
  findAll(): Promise<T[]>
  create(entity: Omit<T, 'id'>): Promise<T>
  update(id: number, entity: Partial<T>): Promise<T>
  delete(id: number): Promise<boolean>
}

abstract class BaseService<T extends { id: number }> {
  constructor(protected repository: Repository<T>) {}

  async get(id: number): Promise<T> {
    const entity = await this.repository.findById(id)
    if (!entity) {
      throw new Error(`Entity with id ${id} not found`)
    }
    return entity
  }

  async getAll(): Promise<T[]> {
    return this.repository.findAll()
  }

  abstract validate(entity: Partial<T>): boolean
}

class UserService extends BaseService<User> {
  validate(entity: Partial<User>): boolean {
    return !!entity.name && entity.name.length > 0
  }
}

type AsyncResult<T, E = Error> = Promise<[T, null] | [null, E]>

async function safeExecute<T>(fn: () => Promise<T>): AsyncResult<T> {
  try {
    const result = await fn()
    return [result, null]
  } catch (error) {
    return [null, error as Error]
  }
}
