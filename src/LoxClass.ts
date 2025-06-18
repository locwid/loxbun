import type { Interpreter } from "./Interpreter"
import { LoxCallable } from "./LoxCallable"
import { LoxInstance } from "./LoxInstance"

export class LoxClass extends LoxCallable {
  name: string

  constructor(name: string) {
    super()
    this.name = name
  }

  arity(): number {
    throw new Error("Method not implemented.")
  }
  call(interpreter: Interpreter, ...args: unknown[]): unknown {
    const instance = new LoxInstance(this)
    return instance
  }

  toString() {
    return this.name
  }
}
