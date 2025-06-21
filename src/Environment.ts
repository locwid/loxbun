import { RuntimeError } from './Interpreter'
import type { Token } from './Token'

export class Environment {
  enclosing: Environment | null
  values = new Map<string, unknown>()

  constructor(enclosing: Environment | null = null) {
    this.enclosing = enclosing
  }

  define(name: string, value: unknown) {
    this.values.set(name, value)
  }

  assign(name: Token, value: unknown) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value)
      return
    }
    if (this.enclosing) {
      this.enclosing.assign(name, value)
      return
    }
    throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`)
  }

  get(name: Token): unknown {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme)
    }
    if (this.enclosing) {
      return this.enclosing.get(name)
    }
    throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`)
  }

  getAt(depth: number, name: string) {
    return this.ancestor(depth).values.get(name)
  }

  assignAt(depth: number, name: Token, value: unknown) {
    this.ancestor(depth).values.set(name.lexeme, value)
  }

  private ancestor(depth: number) {
    let environment: Environment = this
    for (let i = 0; i < depth; i++) {
      if (environment.enclosing) {
        environment = environment.enclosing
      }
    }
    return environment
  }
}
