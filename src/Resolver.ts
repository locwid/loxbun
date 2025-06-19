import type { AssignExpr, BinaryExpr, CallExpr, Expr, ExprVisitor, GetFieldExpr, GroupingExpr, LiteralExpr, LogicalExpr, SetFieldExpr, SuperExpr, ThisExpr, UnaryExpr, VariableExpr } from "./codegen/Expr";
import type { BlockStmt, ClsStmt, ConditionStmt, ExpressionStmt, FnStmt, PrintStmt, ReturnValStmt, Stmt, StmtVisitor, VariableStmt, WhileLoopStmt } from "./codegen/Stmt";
import type { Interpreter } from "./Interpreter";
import { Lox } from "./Lox";
import type { Token } from "./Token";

enum FunctionType {
  NONE,
  FUNCTION,
  METHOD,
  INITIALIZER
}

enum ClassType {
  NONE,
  CLASS,
  SUBCLASS
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private interpreter: Interpreter
  private scopes: Map<string, boolean>[]
  private currentFunction = FunctionType.NONE;
  private currentClass = ClassType.NONE;

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter
    this.scopes = []
  }

	visitClsStmt(stmt: ClsStmt): void {
    const enclosingClass = this.currentClass
    this.currentClass = ClassType.CLASS
		this.declare(stmt.name)
    this.define(stmt.name)

    if (stmt.superclass && stmt.name.lexeme === stmt.superclass.name.lexeme) {
      Lox.errorToken(stmt.superclass.name, "A class can't inherit from itself.")
    }

    if (stmt.superclass) {
      this.currentClass = ClassType.SUBCLASS;
      this.resolveExpr(stmt.superclass)
      this.beginScope()
      this.peekScope()?.set('super', true)
    }

    this.beginScope()
    this.peekScope()?.set('this', true)
    for (const method of stmt.methods) {
      let declaration = FunctionType.METHOD;
      if (method.name.lexeme === 'this') {
        declaration = FunctionType.INITIALIZER;
      }
      this.resolveFunction(method, declaration)
    }
    this.endScope()

    if (stmt.superclass) {
      this.endScope()
    }

    this.currentClass = enclosingClass
	}

  visitBlockStmt(stmt: BlockStmt): void {
    this.beginScope()
    this.resolveStatements(stmt.statements)
    this.endScope()
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.resolveExpr(stmt.expression)
  }

  visitConditionStmt(stmt: ConditionStmt): void {
    this.resolveExpr(stmt.condition)
    this.resolveStatement(stmt.thenBranch)
    if (stmt.elseBranch) {
      this.resolveStatement(stmt.elseBranch)
    }
  }

  visitFnStmt(stmt: FnStmt): void {
    this.declare(stmt.name)
    this.define(stmt.name)
    this.resolveFunction(stmt, FunctionType.FUNCTION)
  }

  visitPrintStmt(stmt: PrintStmt): void {
    this.resolveExpr(stmt.expression)
  }

  visitReturnValStmt(stmt: ReturnValStmt): void {
    if (this.currentFunction === FunctionType.NONE) {
      Lox.errorToken(stmt.keyword, "Can't return from top-level code.")
    }
    if (this.currentFunction === FunctionType.INITIALIZER) {
      Lox.errorToken(stmt.keyword, "Can't return a value from an initializer.")
    }
    if (stmt.value) {
      this.resolveExpr(stmt.value)
    }
  }

  visitVariableStmt(stmt: VariableStmt): void {
    this.declare(stmt.name)
    if (stmt.initializer) {
      this.resolveExpr(stmt.initializer)
    }
    this.define(stmt.name)
  }

  visitWhileLoopStmt(stmt: WhileLoopStmt): void {
    this.resolveExpr(stmt.condition)
    this.resolveStatement(stmt.body)
  }

  visitSuperExpr(expr: SuperExpr): void {
    if (this.currentClass === ClassType.NONE) {
      Lox.errorToken(expr.keyword, "Can't use 'super' outside of class.")
    } else if (this.currentClass !== ClassType.SUBCLASS) {
      Lox.errorToken(expr.keyword, "Can't use 'super' in a class with no superclass.")
    }
    this.resolveLocal(expr, expr.keyword)
  }

  visitThisExpr(expr: ThisExpr): void {
    if (this.currentClass === ClassType.NONE) {
      Lox.errorToken(expr.keyword, "Can't use 'this' outside of a class.")
    }
    this.resolveLocal(expr, expr.keyword)
  }

  visitSetFieldExpr(expr: SetFieldExpr): void {
    this.resolveExpr(expr.value)
    this.resolveExpr(expr.obj)
  }

  visitGetFieldExpr(expr: GetFieldExpr): void {
    this.resolveExpr(expr.obj)
  }

  visitAssignExpr(expr: AssignExpr): void {
    this.resolveExpr(expr.value)
    this.resolveLocal(expr, expr.name)
  }

  visitBinaryExpr(expr: BinaryExpr): void {
    this.resolveExpr(expr.left)
    this.resolveExpr(expr.right)
  }

  visitCallExpr(expr: CallExpr): void {
    this.resolveExpr(expr.callee)
    for (const arg of expr.args) {
      this.resolveExpr(arg)
    }
  }

  visitGroupingExpr(expr: GroupingExpr): void {
    this.resolveExpr(expr.expression)
  }

  visitLiteralExpr(_: LiteralExpr): void {}

  visitLogicalExpr(expr: LogicalExpr): void {
    this.resolveExpr(expr.left)
    this.resolveExpr(expr.right)
  }

  visitUnaryExpr(expr: UnaryExpr): void {
    this.resolveExpr(expr.right)
  }

  visitVariableExpr(expr: VariableExpr): void {
    if (this.scopes.length && this.scopes[0]?.get(expr.name.lexeme) === false) {
      Lox.errorToken(expr.name, `Can't read local variable in it's own initializer.`)
    }
    this.resolveLocal(expr, expr.name)
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
    const scope = this.peekScope()
    if (scope) {
      if (scope.has(name.lexeme)) {
        Lox.errorToken(name, "Already a variable with this name in this scope.")
      }
      scope.set(name.lexeme, false)
    }
  }

  private define(name: Token) {
    if (!this.scopes.length) return
    this.peekScope()?.set(name.lexeme, true)
  }

  private resolveLocal(expr: Expr, name: Token) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i]?.has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i)
        return
      }
    }
  }

  private peekScope() {
    return this.scopes[this.scopes.length - 1]
  }
}
