import { RuntimeError } from "./Interpreter"
import type { Token } from "./Token"

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
    const value = this.values.get(name.lexeme)
    if (value) {
      return value
    }
    if (this.enclosing) {
      return this.enclosing.get(name)
    }
    throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`)
  }
}
