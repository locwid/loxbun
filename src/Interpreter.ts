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
} from "./codegen/Expr";
import type {
	BlockStmt,
	ConditionStmt,
	ExpressionStmt,
	FnStmt,
	PrintStmt,
	Stmt,
	StmtVisitor,
	VariableStmt,
	WhileLoopStmt,
} from "./codegen/Stmt";
import { Environment } from "./Environment";
import { Lox } from "./Lox";
import { LoxCallable } from "./LoxCallable";
import { LoxFunction } from "./LoxFunction";
import { Token } from "./Token";
import { TokenType } from "./TokenType";

export class RuntimeError extends Error {
	token: Token;

	constructor(token: Token, message: string) {
		super(message);
		this.token = token;
	}
}

export class Interpreter implements ExprVisitor<unknown>, StmtVisitor<void> {
	globals = new Environment()
	private environment = this.globals

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

	execute(stmt: Stmt): void {
		stmt.accept(this);
	}

	stringify(value: unknown): string {
		if (value === null) return "nil";
		return `${value}`;
	}

	visitWhileLoopStmt(stmt: WhileLoopStmt): void {
		while (this.isTruthy(this.evaluate(stmt.condition))) {
			this.execute(stmt.body)
		}
	}

	visitConditionStmt(stmt: ConditionStmt): void {
		if (this.isTruthy(this.evaluate(stmt.condition))) {
			this.execute(stmt.thenBranch)
		} else if (stmt.elseBranch) {
			this.execute(stmt.elseBranch)
		}
	}

	visitFnStmt(stmt: FnStmt): void {
		const fn = new LoxFunction(stmt)
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
		this.environment.assign(expr.name, value)
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

	visitBinaryExpr(binary: BinaryExpr): unknown {
		let left = this.evaluate(binary.left);
		let right = this.evaluate(binary.right);

		switch (binary.operator.type) {
			case TokenType.BANG_EQUAL:
				return !this.isEqual(left, right);
			case TokenType.EQUAL_EQUAL:
				return this.isEqual(left, right);
			case TokenType.GREATER:
				this.checkNumberOperands(binary.operator, left, right);
				return Number(left) > Number(right);
			case TokenType.GREATER_EQUAL:
				this.checkNumberOperands(binary.operator, left, right);
				return Number(left) >= Number(right);
			case TokenType.LESS:
				this.checkNumberOperands(binary.operator, left, right);
				return Number(left) < Number(right);
			case TokenType.LESS_EQUAL:
				this.checkNumberOperands(binary.operator, left, right);
				return Number(left) <= Number(right);
			case TokenType.MINUS:
				this.checkNumberOperands(binary.operator, left, right);
				return Number(left) - Number(right);
			case TokenType.PLUS:
				if (typeof left === "string" && typeof right === "string") {
					return String(left) + String(right);
				}
				if (typeof left === "number" && typeof right === "number") {
					return Number(left) + Number(right);
				}
				throw new RuntimeError(
					binary.operator,
					"Operands must be two numbers or two strings.",
				);
			case TokenType.SLASH:
				this.checkNumberOperands(binary.operator, left, right);
				return Number(left) / Number(right);
			case TokenType.STAR:
				this.checkNumberOperands(binary.operator, left, right);
				return Number(left) * Number(right);
		}

		return null;
	}
	
	visitGroupingExpr(grouping: GroupingExpr): unknown {
		return this.evaluate(grouping.expression);
	}

	visitLiteralExpr(literal: LiteralExpr): unknown {
		return literal.value;
	}

	visitUnaryExpr(unary: UnaryExpr): unknown {
		const right = this.evaluate(unary.right);

		switch (unary.operator.type) {
			case TokenType.BANG:
				return !this.isTruthy(right);
			case TokenType.MINUS:
				this.checkNumberOperand(unary.operator, right);
				return -Number(right);
		}

		return null;
	}

	visitVariableExpr(variable: VariableExpr): unknown {
		return this.environment.get(variable.name)
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
