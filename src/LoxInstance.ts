import { RuntimeError } from "./Interpreter";
import type { LoxClass } from "./LoxClass";
import type { Token } from "./Token";

export class LoxInstance {
  private cls: LoxClass
  private fields = new Map<string, unknown>()

  constructor(cls: LoxClass) {
    this.cls = cls
  }

  get(name: Token) {
    if (this.fields.has(name.lexeme)) {
      return this.fields.get(name.lexeme)
    }
    throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`)
  }

  toString() {
    return `${this.cls.name} instance`
  }
}
