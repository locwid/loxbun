import { Interpreter, type RuntimeError } from './Interpreter'
import { Parser } from './Parser'
import { Resolver } from './Resolver'
import { Scanner } from './Scanner'
import type { Token } from './Token'
import { TokenType } from './TokenType'

export class Lox {
  private static interpreter = new Interpreter()
  private static hadError = false
  private static hadRuntimeError = false

  static error(line: number, message: string) {
    Lox.report(line, '', message)
  }

  static errorToken(token: Token, message: string) {
    if (token.type == TokenType.EOF) {
      this.report(token.line, ' at end', message)
    } else {
      this.report(token.line, " at '" + token.lexeme + "'", message)
    }
  }

  static runtimeError(error: RuntimeError) {
    console.error(`${error.message} \n[line ${error.token.line}]`)
    Lox.hadRuntimeError = true
  }

  private static report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error${where}: ${message}`)
    this.hadError = true
  }

  run(source: string) {
    Lox.hadError = false
    Lox.hadRuntimeError = false

    const scanner = new Scanner(source)
    const tokens = scanner.scanTokens()
    const parser = new Parser(tokens)
    const statements = parser.parse()

    if (Lox.hadError) {
      return
    }

    const resolver = new Resolver(Lox.interpreter)
    resolver.resolveStatements(statements)

    if (Lox.hadError) {
      return
    }

    Lox.interpreter.interpret(statements)
  }

  async runFile(path: string) {
    const content = await Bun.file(path).text()
    this.run(content)
    if (Lox.hadError) process.exit(65)
    if (Lox.hadRuntimeError) process.exit(70)
  }

  async runPrompt() {
    console.write('> ')
    for await (const line of console) {
      this.run(line)
      Lox.hadError = false
      console.write('> ')
    }
  }
}
