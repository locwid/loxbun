import { RuntimeError } from './Interpreter'
import type { LoxClass } from './LoxClass'
import type { LoxFunction } from './LoxFunction'
import type { Token } from './Token'

export class LoxInstance {
  private cls: LoxClass
  private fields = new Map<string, unknown>()

  constructor(cls: LoxClass) {
    this.cls = cls
  }

  get(name: Token): unknown | LoxFunction {
    if (this.fields.has(name.lexeme)) {
      return this.fields.get(name.lexeme)
    }
    const method = this.cls.findMethod(name.lexeme)
    if (method) {
      return method.bind(this)
    }
    throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`)
  }

  set(name: Token, value: unknown) {
    this.fields.set(name.lexeme, value)
  }

  toString() {
    return `${this.cls.name} instance`
  }
}
