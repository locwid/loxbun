import type { FnStmt } from "./codegen/Stmt";
import { Environment } from "./Environment";
import { type Interpreter } from "./Interpreter";
import { LoxCallable } from "./LoxCallable";

export class LoxFunction extends LoxCallable {
  declaration: FnStmt

  constructor(declaration: FnStmt) {
    super()
    this.declaration = declaration
  }

  arity(): number {
    return this.declaration.params.length
  }
  call(interpreter: Interpreter, ...args: unknown[]): unknown {
    const environment = new Environment(interpreter.globals)
    for (let i = 0; i < this.declaration.params.length; i++) {
      const arg = this.declaration.params[i]
      if (!arg) {
        throw new Error("Function call: failed to get arg")
      }
      environment.define(arg.lexeme, args[i])
    }
    interpreter.executeBlock(this.declaration.body, environment)
    return null
  }
  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`
  }
}
