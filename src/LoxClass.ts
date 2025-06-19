import type { Interpreter } from "./Interpreter"
import { LoxCallable } from "./LoxCallable"
import type { LoxFunction } from "./LoxFunction"
import { LoxInstance } from "./LoxInstance"

export class LoxClass extends LoxCallable {
  name: string
  superclass: LoxClass | null
  methods: Map<string, LoxFunction>

  constructor(name: string, superclass: LoxClass | null, methods: Map<string, LoxFunction>) {
    super()
    this.name = name
    this.superclass = superclass
    this.methods = methods
  }

  findMethod(name: string): LoxFunction | null {
    let method = this.methods.get(name) 
    if (method) {
      return method
    }

    if (this.superclass) {
      return this.superclass.findMethod(name)
    }
    return null
  }

  arity(): number {
    const initializer = this.findMethod('init')
    if (initializer) {
      return initializer.arity()
    }
    return 0
  }

  call(interpreter: Interpreter, ...args: unknown[]): unknown {
    const instance = new LoxInstance(this)

    const initializer = this.findMethod('init')
    if (initializer) {
      initializer.bind(instance).call(interpreter, ...args)
    }

    return instance
  }

  toString() {
    return this.name
  }
}
