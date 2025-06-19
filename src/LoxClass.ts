import type { Interpreter } from "./Interpreter"
import { LoxCallable } from "./LoxCallable"
import type { LoxFunction } from "./LoxFunction"
import { LoxInstance } from "./LoxInstance"

export class LoxClass extends LoxCallable {
  name: string
  methods: Map<string, LoxFunction>

  constructor(name: string, methods: Map<string, LoxFunction>) {
    super()
    this.name = name
    this.methods = methods
  }

  findMethod(name: string) {
    return this.methods.get(name) ?? null
  }

  arity(): number {
    return 0
  }

  call(interpreter: Interpreter, ...args: unknown[]): unknown {
    return new LoxInstance(this)
  }

  toString() {
    return this.name
  }
}
