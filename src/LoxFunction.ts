import type { FnStmt } from "./codegen/Stmt";
import { Environment } from "./Environment";
import { Return, type Interpreter } from "./Interpreter";
import { LoxCallable } from "./LoxCallable";

export class LoxFunction extends LoxCallable {
  declaration: FnStmt
  closure: Environment

  constructor(declaration: FnStmt, closure: Environment) {
    super()
    this.declaration = declaration
    this.closure = closure
  }

  arity(): number {
    return this.declaration.params.length
  }
  call(interpreter: Interpreter, ...args: unknown[]): unknown {
    const environment = new Environment(this.closure)
    for (let i = 0; i < this.declaration.params.length; i++) {
      const arg = this.declaration.params[i]
      if (!arg) {
        throw new Error("Function call: failed to get arg")
      }
      environment.define(arg.lexeme, args[i])
    }
    try {
      interpreter.executeBlock(this.declaration.body, environment)
    } catch (error) {
      if (error instanceof Return) {
        return error.value
      }
    }
    
    return null
  }
  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`
  }
}
