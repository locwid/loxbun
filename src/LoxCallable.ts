import type { Interpreter } from "./Interpreter";

export abstract class LoxCallable {
  abstract arity(): number
  abstract call(interpreter: Interpreter, ...args: unknown[]): unknown
  abstract toString(): string
}
