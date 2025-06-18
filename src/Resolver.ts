import type { AssignExpr, BinaryExpr, CallExpr, Expr, ExprVisitor, FieldExpr, GroupingExpr, LiteralExpr, LogicalExpr, UnaryExpr, VariableExpr } from "./codegen/Expr";
import type { BlockStmt, ClsStmt, ConditionStmt, ExpressionStmt, FnStmt, PrintStmt, ReturnValStmt, Stmt, StmtVisitor, VariableStmt, WhileLoopStmt } from "./codegen/Stmt";
import type { Interpreter } from "./Interpreter";
import { Lox } from "./Lox";
import type { Token } from "./Token";

enum FunctionType {
  NONE,
  FUNCTION
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private interpreter: Interpreter
  private scopes: Map<string, boolean>[]
  private currentFunction = FunctionType.NONE;

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
    this.scopes = []
  }


  visitFieldExpr(field: FieldExpr): void {
    this.resolveExpr(field.obj)
  }

	visitClsStmt(cls: ClsStmt): void {
		this.declare(cls.name)
    this.define(cls.name)
	}

  visitBlockStmt(block: BlockStmt): void {
    this.beginScope()
    this.resolveStatements(block.statements)
    this.endScope()
  }

  visitExpressionStmt(expression: ExpressionStmt): void {
    this.resolveExpr(expression.expression)
  }

  visitConditionStmt(condition: ConditionStmt): void {
    this.resolveExpr(condition.condition)
    this.resolveStatement(condition.thenBranch)
    if (condition.elseBranch) {
      this.resolveStatement(condition.elseBranch)
    }
  }

  visitFnStmt(fn: FnStmt): void {
    this.declare(fn.name)
    this.define(fn.name)
    this.resolveFunction(fn, FunctionType.FUNCTION)
  }

  visitPrintStmt(print: PrintStmt): void {
    this.resolveExpr(print.expression)
  }

  visitReturnValStmt(returnval: ReturnValStmt): void {
    if (this.currentFunction == FunctionType.NONE) {
      Lox.errorToken(returnval.keyword, "Can't return from top-level code.")
    }
    if (returnval.value) {
      this.resolveExpr(returnval.value)
    }
  }

  visitVariableStmt(variable: VariableStmt): void {
    this.declare(variable.name)
    if (variable.initializer) {
      this.resolveExpr(variable.initializer)
    }
    this.define(variable.name)
  }

  visitWhileLoopStmt(whileloop: WhileLoopStmt): void {
    this.resolveExpr(whileloop.condition)
    this.resolveStatement(whileloop.body)
  }

  visitAssignExpr(assign: AssignExpr): void {
    this.resolveExpr(assign.value)
    this.resolveLocal(assign, assign.name)
  }

  visitBinaryExpr(binary: BinaryExpr): void {
    this.resolveExpr(binary.left)
    this.resolveExpr(binary.right)
  }

  visitCallExpr(call: CallExpr): void {
    this.resolveExpr(call.callee)
    for (const arg of call.args) {
      this.resolveExpr(arg)
    }
  }

  visitGroupingExpr(grouping: GroupingExpr): void {
    this.resolveExpr(grouping.expression)
  }

  visitLiteralExpr(_: LiteralExpr): void {}

  visitLogicalExpr(logical: LogicalExpr): void {
    this.resolveExpr(logical.left)
    this.resolveExpr(logical.right)
  }

  visitUnaryExpr(unary: UnaryExpr): void {
    this.resolveExpr(unary.right)
  }

  visitVariableExpr(variable: VariableExpr): void {
    if (this.scopes.length && this.scopes[0]?.get(variable.name.lexeme) === false) {
      Lox.errorToken(variable.name, `Can't read local variable in it's own initializer.`)
    }
    this.resolveLocal(variable, variable.name)
  }

  private beginScope() {
    this.scopes.push(new Map())
  }

  private endScope() {
    this.scopes.pop()
  }

  private resolveFunction(stmt: FnStmt, type: FunctionType) {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = type
    this.beginScope()
    for (const param of stmt.params) {
      this.declare(param)
      this.define(param)
    }
    this.resolveStatements(stmt.body)
    this.endScope()
    this.currentFunction = enclosingFunction
  }

  resolveStatements(statements: Stmt[]) {
    for (const stmt of statements) {
      this.resolveStatement(stmt)
    }
  }

  private resolveStatement(stmt: Stmt) {
    stmt.accept(this)
  }

  private resolveExpr(expr: Expr) {
    expr.accept(this)
  }

  private declare(name: Token) {
    if (!this.scopes.length) return
    const scope = this.scopes[0]
    if (scope) {
      if (scope.has(name.lexeme)) {
        Lox.errorToken(name, "Already a variable with this name in this scope.")
      }
      scope.set(name.lexeme, false)
    }
  }

  private define(name: Token) {
    if (!this.scopes.length) return
    this.scopes[0]?.set(name.lexeme, true)
  }

  private resolveLocal(expr: Expr, name: Token) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i]?.has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i)
      }
    }
  }
}
