class Person {
  private name: string
  protected age: number
  public email: string

  constructor(name: string, age: number, email: string) {
    this.name = name
    this.age = age
    this.email = email
  }

  public greet(): string {
    return `Hello, I'm ${this.name}`
  }

  private getAge(): number {
    return this.age
  }
}
