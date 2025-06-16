import {
	AssignExpr,
	BinaryExpr,
	Expr,
	GroupingExpr,
	LiteralExpr,
	UnaryExpr,
	VariableExpr,
} from "./codegen/Expr";
import { BlockStmt, ExpressionStmt, PrintStmt, VariableStmt, type Stmt } from "./codegen/Stmt";
import { Lox } from "./Lox";
import { Token } from "./Token";
import { TokenType } from "./TokenType";

class ParseError extends Error {}

export class Parser {
	tokens: Token[];
	current: number = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	public parse(): Stmt[] {
		const statements: Stmt[] = [];
		while (!this.isAtEnd()) {
			const stmt = this.declaration()
			if (stmt) {
				statements.push(stmt);
			}
		}
		return statements;
	}

	private declaration(): Stmt | null {
		try {
			if (this.match(TokenType.VAR)) {
				return this.varDeclaration()
			}
			return this.statement()
		} catch (error) {
			if (error instanceof ParseError) {
				this.synchronize()
				return null
			}
			return null
		}
	}

	private varDeclaration(): Stmt {
		const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.")

		let initializer = this.match(TokenType.EQUAL) ? this.expression() : null;

		this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.")
		return new VariableStmt(name, initializer)
	}

	private statement(): Stmt {
		if (this.match(TokenType.PRINT)) {
			return this.printStatement();
		}
		if (this.match(TokenType.LEFT_BRACE)) {
			return new BlockStmt(this.block())
		}
		return this.expressionStmt();
	}

	private printStatement(): Stmt {
		const expr = this.expression();
		this.consume(TokenType.SEMICOLON, "Expect ';' after value.");
		return new PrintStmt(expr);
	}

	private expressionStmt(): Stmt {
		const expr = this.expression();
		this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
		return new ExpressionStmt(expr);
	}

	private block() {
		const statements: Stmt[] = []
		while(!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
			const statement = this.declaration()
			if (statement) {
				statements.push(statement)
			}
		}
		this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.")
		return statements
	}

	private expression(): Expr {
		return this.assignment();
	}

	private assignment(): Expr {
		const expr = this.equality()

		if (this.match(TokenType.EQUAL)) {
			const equals = this.previous()
			const value = this.assignment()
			if (expr instanceof VariableExpr) {
				return new AssignExpr(expr.name, value)
			}
			this.error(equals, "Invalid assignment targe.")
		}

		return expr
	}

	private equality(): Expr {
		let expr = this.comparison();

		while (this.match(TokenType.EQUAL_EQUAL, TokenType.BANG_EQUAL)) {
			const operator = this.previous();
			const right = this.comparison();
			expr = new BinaryExpr(expr, operator, right);
		}

		return expr;
	}

	private comparison(): Expr {
		let expr = this.term();

		while (
			this.match(
				TokenType.GREATER,
				TokenType.GREATER_EQUAL,
				TokenType.LESS,
				TokenType.LESS_EQUAL,
			)
		) {
			const operator = this.previous();
			const right = this.term();
			expr = new BinaryExpr(expr, operator, right);
		}

		return expr;
	}

	private term(): Expr {
		let expr = this.factor();

		while (this.match(TokenType.MINUS, TokenType.PLUS)) {
			const operator = this.previous();
			const right = this.factor();
			expr = new BinaryExpr(expr, operator, right);
		}

		return expr;
	}

	private factor(): Expr {
		let expr = this.unary();

		while (this.match(TokenType.SLASH, TokenType.STAR)) {
			const operator = this.previous();
			const right = this.unary();
			expr = new BinaryExpr(expr, operator, right);
		}

		return expr;
	}

	private unary(): Expr {
		if (this.match(TokenType.BANG, TokenType.MINUS)) {
			const operator = this.previous();
			const right = this.unary();
			return new UnaryExpr(operator, right);
		}

		return this.primary();
	}

	private primary(): Expr {
		if (this.match(TokenType.FALSE)) {
			return new LiteralExpr(false);
		}
		if (this.match(TokenType.TRUE)) {
			return new LiteralExpr(true);
		}
		if (this.match(TokenType.NIL)) {
			return new LiteralExpr(null);
		}

		if (this.match(TokenType.STRING, TokenType.NUMBER)) {
			return new LiteralExpr(this.previous().literal);
		}

		if (this.match(TokenType.IDENTIFIER)) {
			return new VariableExpr(this.previous())
		}

		if (this.match(TokenType.LEFT_PAREN)) {
			const expr = this.expression();
			this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
			return new GroupingExpr(expr);
		}

		throw this.error(this.peek(), "Expect expression.");
	}

	private match(...types: TokenType[]) {
		for (const type of types) {
			if (this.check(type)) {
				this.advance();
				return true;
			}
		}
		return false;
	}

	private check(type: TokenType) {
		if (this.isAtEnd()) return false;
		return this.peek().type === type;
	}

	private advance() {
		if (!this.isAtEnd()) this.current++;
		return this.previous();
	}

	private isAtEnd() {
		return this.peek().type === TokenType.EOF;
	}

	private peek() {
		const token = this.tokens[this.current];
		if (!token) {
			throw new Error("peek token not found");
		}
		return token;
	}

	private previous() {
		const prev = this.tokens[this.current - 1];
		if (!prev) {
			throw new Error("previous token not found");
		}
		return prev;
	}

	private consume(type: TokenType, message: string) {
		if (this.check(type)) {
			return this.advance();
		}
		throw this.error(this.peek(), message);
	}

	private synchronize() {
		this.advance();

		while (!this.isAtEnd()) {
			if (this.previous().type === TokenType.SEMICOLON) {
				return;
			}

			switch (this.peek().type) {
				case TokenType.CLASS:
				case TokenType.FUN:
				case TokenType.VAR:
				case TokenType.FOR:
				case TokenType.IF:
				case TokenType.WHILE:
				case TokenType.PRINT:
				case TokenType.RETURN:
					return;
			}

			this.advance();
		}
	}

	private error(token: Token, message: string) {
		Lox.errorToken(token, message);
		return new ParseError();
	}
}
