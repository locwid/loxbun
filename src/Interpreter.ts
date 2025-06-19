import type {
	ExprVisitor,
	BinaryExpr,
	Expr,
	GroupingExpr,
	LiteralExpr,
	UnaryExpr,
	VariableExpr,
	AssignExpr,
	LogicalExpr,
	CallExpr,
	GetFieldExpr,
	SetFieldExpr,
	ThisExpr,
} from "./codegen/Expr";
import type {
	BlockStmt,
	ClsStmt,
	ConditionStmt,
	ExpressionStmt,
	FnStmt,
	PrintStmt,
	ReturnValStmt,
	Stmt,
	StmtVisitor,
	VariableStmt,
	WhileLoopStmt,
} from "./codegen/Stmt";
import { Environment } from "./Environment";
import { Lox } from "./Lox";
import { LoxCallable } from "./LoxCallable";
import { LoxClass } from "./LoxClass";
import { LoxFunction } from "./LoxFunction";
import { LoxInstance } from "./LoxInstance";
import { Token } from "./Token";
import { TokenType } from "./TokenType";

export class RuntimeError extends Error {
	token: Token;

	constructor(token: Token, message: string) {
		super(message);
		this.token = token;
	}
}

export class Return extends Error {
	value: unknown

	constructor(value: unknown) {
		super()
		this.value = value
	}
}

export class Interpreter implements ExprVisitor<unknown>, StmtVisitor<void> {
	globals = new Environment()
	private environment = this.globals
	private locals = new Map<Expr, number>()

	constructor() {
		this.globals.define("clock", new class extends LoxCallable {
			arity(): number {
				return 0
			}
			call(_: Interpreter, ...__: unknown[]): unknown {
				return new Date().getTime() / 1000;
			}
			toString(): string {
				return '<native fn>'
			}
		})
	}
	
	interpret(stmts: Stmt[]) {
		try {
			for (const stmt of stmts) {
				this.execute(stmt);
			}
		} catch (error) {
			if (error instanceof RuntimeError) {
				Lox.runtimeError(error);
			}
		}
	}

	resolve(expr: Expr, depth: number) {
		this.locals.set(expr, depth)
	}

	execute(stmt: Stmt): void {
		stmt.accept(this);
	}

	stringify(value: unknown): string {
		if (value === null) return "nil";
		return `${value}`;
	}

	visitThisExpr(expr: ThisExpr): unknown {
		return this.lookUpVariable(expr.keyword, expr)
	}

	visitClsStmt(stmt: ClsStmt): void {
		this.environment.define(stmt.name.lexeme, null)
		const methods = new Map<string, LoxFunction>()
		for (const method of stmt.methods) {
			const fn = new LoxFunction(method, this.environment)
			methods.set(method.name.lexeme, fn)
		}
		const cls = new LoxClass(stmt.name.lexeme, methods)
		this.environment.assign(stmt.name, cls)
	}

	visitWhileLoopStmt(stmt: WhileLoopStmt): void {
		while (this.isTruthy(this.evaluate(stmt.condition))) {
			this.execute(stmt.body)
		}
	}

	visitReturnValStmt(stmt: ReturnValStmt): void {
		let value: unknown = null
		if (stmt.value != null) {
			value = this.evaluate(stmt.value)
		}
		throw new Return(value)
	}

	visitConditionStmt(stmt: ConditionStmt): void {
		if (this.isTruthy(this.evaluate(stmt.condition))) {
			this.execute(stmt.thenBranch)
		} else if (stmt.elseBranch) {
			this.execute(stmt.elseBranch)
		}
	}

	visitFnStmt(stmt: FnStmt): void {
		const fn = new LoxFunction(stmt, this.environment)
		this.environment.define(stmt.name.lexeme, fn)
	}

	visitBlockStmt(stmt: BlockStmt): void {
		this.executeBlock(stmt.statements, new Environment(this.environment))
	}

	visitExpressionStmt(stmt: ExpressionStmt): void {
		this.evaluate(stmt.expression);
	}

	visitPrintStmt(stmt: PrintStmt): void {
		const value = this.evaluate(stmt.expression);
		console.log(this.stringify(value));
	}
	
	visitVariableStmt(stmt: VariableStmt): void {
		let value: unknown = null
		if (stmt.initializer !== null) {
			value = this.evaluate(stmt.initializer)
		}
		this.environment.define(stmt.name.lexeme, value)
	}

	visitSetFieldExpr(expr: SetFieldExpr): unknown {
		const obj = this.evaluate(expr.obj)
		if (!(obj instanceof LoxInstance)) {
			throw new RuntimeError(expr.name, "Only instances have fields.")
		}
		const value = this.evaluate(expr.value)
		obj.set(expr.name, value)
		return value
	}

	visitGetFieldExpr(expr: GetFieldExpr): unknown {
		const obj = this.evaluate(expr.obj)
		if (obj instanceof LoxInstance) {
			return obj.get(expr.name)
		}
		throw new RuntimeError(expr.name, "Only instances have properties.")
	}

	visitLogicalExpr(expr: LogicalExpr): unknown {
		const left = this.evaluate(expr.left)

		if (expr.operator.type === TokenType.OR) {
			if (this.isTruthy(left)) {
				return left
			}
		} else {
			if (!this.isTruthy(left)) {
				return left
			}
		}

		return this.evaluate(expr.right)
	}

	visitAssignExpr(expr: AssignExpr): unknown {
		const value = this.evaluate(expr.value)
		
		const depth = this.locals.get(expr)
		if (depth) {
			this.environment.assignAt(depth, expr.name, value)
		} else {
			this.globals.assign(expr.name, value)
		}
		
		return value
	}

	visitCallExpr(expr: CallExpr): unknown {
		const callee = this.evaluate(expr.callee)

		const args: unknown[] = []
		for (const arg of expr.args) {
			args.push(this.evaluate(arg))
		}

		if (!(callee instanceof LoxCallable)) {
			throw new RuntimeError(expr.paren, "Can only call functions and classes.")
		}
		if (args.length !== callee.arity()) {
			throw new RuntimeError(expr.paren, `Expected ${callee.arity()} arguments but got ${args.length}.`)
		}

		return callee.call(this, ...args)
	}

	visitBinaryExpr(expr: BinaryExpr): unknown {
		let left = this.evaluate(expr.left);
		let right = this.evaluate(expr.right);

		switch (expr.operator.type) {
			case TokenType.BANG_EQUAL:
				return !this.isEqual(left, right);
			case TokenType.EQUAL_EQUAL:
				return this.isEqual(left, right);
			case TokenType.GREATER:
				this.checkNumberOperands(expr.operator, left, right);
				return Number(left) > Number(right);
			case TokenType.GREATER_EQUAL:
				this.checkNumberOperands(expr.operator, left, right);
				return Number(left) >= Number(right);
			case TokenType.LESS:
				this.checkNumberOperands(expr.operator, left, right);
				return Number(left) < Number(right);
			case TokenType.LESS_EQUAL:
				this.checkNumberOperands(expr.operator, left, right);
				return Number(left) <= Number(right);
			case TokenType.MINUS:
				this.checkNumberOperands(expr.operator, left, right);
				return Number(left) - Number(right);
			case TokenType.PLUS:
				if (typeof left === "string" && typeof right === "string") {
					return String(left) + String(right);
				}
				if (typeof left === "number" && typeof right === "number") {
					return Number(left) + Number(right);
				}
				throw new RuntimeError(
					expr.operator,
					"Operands must be two numbers or two strings.",
				);
			case TokenType.SLASH:
				this.checkNumberOperands(expr.operator, left, right);
				return Number(left) / Number(right);
			case TokenType.STAR:
				this.checkNumberOperands(expr.operator, left, right);
				return Number(left) * Number(right);
		}

		return null;
	}
	
	visitGroupingExpr(expr: GroupingExpr): unknown {
		return this.evaluate(expr.expression);
	}

	visitLiteralExpr(expr: LiteralExpr): unknown {
		return expr.value;
	}

	visitUnaryExpr(expr: UnaryExpr): unknown {
		const right = this.evaluate(expr.right);

		switch (expr.operator.type) {
			case TokenType.BANG:
				return !this.isTruthy(right);
			case TokenType.MINUS:
				this.checkNumberOperand(expr.operator, right);
				return -Number(right);
		}

		return null;
	}

	visitVariableExpr(expr: VariableExpr): unknown {
		return this.lookUpVariable(expr.name, expr)
	}

	private lookUpVariable(name: Token, expr: Expr) {
		const depth = this.locals.get(expr)
		if (depth) {
			return this.environment.getAt(depth, name.lexeme)
		} else {
			return this.globals.get(name)
		}
	}

	executeBlock(statements: Stmt[], environment: Environment) {
		const prevEnvironment = this.environment;
		try {
			this.environment = environment
			for (const stmt of statements) {
				this.execute(stmt)
			}
		} finally {
			this.environment = prevEnvironment
		}
	}

	private evaluate(expr: Expr): unknown {
		return expr.accept(this);
	}

	private isTruthy(value: unknown): boolean {
		if (value === null) return false;
		if (typeof value === "boolean") return Boolean(value);
		return true;
	}

	private isEqual(left: unknown, right: unknown): boolean {
		if (left === null && right === null) return true;
		if (left === null) return false;
		return left === right;
	}

	private checkNumberOperand(operator: Token, operand: unknown) {
		if (typeof operand !== "number") {
			throw new RuntimeError(operator, "Operand must be a number.");
		}
	}

	private checkNumberOperands(operator: Token, left: unknown, right: unknown) {
		if (typeof left !== "number" || typeof right !== "number") {
			throw new RuntimeError(operator, "Operands must be numbers.");
		}
	}
}
