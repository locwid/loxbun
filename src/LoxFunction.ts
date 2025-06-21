import type { FnStmt } from './codegen/Stmt'
import { Environment } from './Environment'
import { Return, type Interpreter } from './Interpreter'
import { LoxCallable } from './LoxCallable'
import type { LoxInstance } from './LoxInstance'

export class LoxFunction extends LoxCallable {
  declaration: FnStmt
  private closure: Environment
  private isInitializer: boolean

  constructor(
    declaration: FnStmt,
    closure: Environment,
    isInitializer: boolean,
  ) {
    super()
    this.declaration = declaration
    this.closure = closure
    this.isInitializer = isInitializer
  }

  arity(): number {
    return this.declaration.params.length
  }

  call(interpreter: Interpreter, ...args: unknown[]): unknown {
    const environment = new Environment(this.closure)
    for (let i = 0; i < this.declaration.params.length; i++) {
      const arg = this.declaration.params[i]
      if (arg) {
        environment.define(arg.lexeme, args[i])
      }
    }
    try {
      interpreter.executeBlock(this.declaration.body, environment)
    } catch (error) {
      if (error instanceof Return) {
        return error.value
      }
    }
    if (this.isInitializer) {
      return this.closure.getAt(0, 'this')
    }
    return null
  }

  bind(instance: LoxInstance) {
    const environment = new Environment(this.closure)
    environment.define('this', instance)
    return new LoxFunction(this.declaration, environment, this.isInitializer)
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`
  }
}
