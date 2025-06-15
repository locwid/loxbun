import { Lox } from "./Lox";
import { Token } from "./Token";
import { TokenType } from "./TokenType";

export class Scanner {
	private source: string;
	private tokens: Token[] = [];
	private keywords: Map<string, TokenType> = new Map([
		["and", TokenType.AND],
		["class", TokenType.CLASS],
		["else", TokenType.ELSE],
		["false", TokenType.FALSE],
		["for", TokenType.FOR],
		["fun", TokenType.FUN],
		["if", TokenType.IF],
		["nil", TokenType.NIL],
		["or", TokenType.OR],
		["print", TokenType.PRINT],
		["return", TokenType.RETURN],
		["super", TokenType.SUPER],
		["this", TokenType.THIS],
		["true", TokenType.TRUE],
		["var", TokenType.VAR],
		["while", TokenType.WHILE],
	]);

	private start = 0;
	private current = 0;
	private line = 1;

	constructor(source: string) {
		this.source = source;
	}

	public scanTokens(): Token[] {
		while (!this.isAtEnd()) {
			this.start = this.current;
			this.scanToken();
		}

		this.tokens.push(new Token(TokenType.EOF, "", {}, this.line));
		return this.tokens;
	}

	private isAtEnd(): boolean {
		return this.current >= this.source.length;
	}

	private scanToken() {
		const c = this.advance();
		if (!c) {
			throw new Error(`scanToken: missing next character`);
		}
		switch (c) {
			case "(":
				this.addToken(TokenType.LEFT_PAREN);
				break;
			case ")":
				this.addToken(TokenType.RIGHT_PAREN);
				break;
			case "{":
				this.addToken(TokenType.LEFT_BRACE);
				break;
			case "}":
				this.addToken(TokenType.RIGHT_BRACE);
				break;
			case ",":
				this.addToken(TokenType.COMMA);
				break;
			case ".":
				this.addToken(TokenType.DOT);
				break;
			case "-":
				this.addToken(TokenType.MINUS);
				break;
			case "+":
				this.addToken(TokenType.PLUS);
				break;
			case ";":
				this.addToken(TokenType.SEMICOLON);
				break;
			case "*":
				this.addToken(TokenType.STAR);
				break;
			case "!":
				this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
				break;
			case "=":
				this.addToken(
					this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL,
				);
				break;
			case "<":
				this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
				break;
			case ">":
				this.addToken(
					this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER,
				);
				break;
			case "/":
				if (this.match("/")) {
					// Skip comments
					while (this.peek() !== "\n" && !this.isAtEnd()) this.advance();
				} else {
					this.addToken(TokenType.SLASH);
				}
				break;
			case " ":
			case "\t":
			case "\r":
				break;
			case "\n":
				this.line++;
				break;
			case '"':
				this.string();
				break;
			default:
				if (this.isDigit(c)) {
					this.number();
				} else if (this.isAlpha(c)) {
					this.identifier();
				} else {
					Lox.error(this.line, "Unexpected character.");
				}
				break;
		}
	}

	private advance() {
		return this.source[this.current++];
	}

	private match(expected: string): boolean {
		if (this.isAtEnd()) return false;
		if (this.source[this.current] !== expected) return false;

		this.current++;
		return true;
	}

	private peek() {
		if (this.isAtEnd()) return "\0";
		const c = this.source[this.current];
		if (!c) {
			throw new Error("peek: missing next character");
		}
		return c;
	}

	private peekNext() {
		if (this.current + 1 >= this.source.length) return "\0";
		const c = this.source[this.current + 1];
		if (!c) {
			throw new Error("peekNext: missing next character");
		}
		return c;
	}

	private string() {
		while (this.peek() != '"' && !this.isAtEnd()) {
			if (this.peek() == "\n") this.line++;
			this.advance();
		}

		if (this.isAtEnd()) {
			Lox.error(this.line, "Unterminated string.");
			return;
		}

		this.advance();
		const value = this.source.substring(this.start + 1, this.current - 1);
		this.addToken(TokenType.STRING, value);
	}

	private number() {
		while (this.isDigit(this.peek())) this.advance();

		if (this.peek() === "." && this.isDigit(this.peekNext())) {
			this.advance();
			while (this.isDigit(this.peek())) this.advance();
		}

		this.addToken(
			TokenType.NUMBER,
			parseFloat(this.source.substring(this.start, this.current)),
		);
	}

	private identifier() {
		while (this.isAlphaNumeric(this.peek())) this.advance();

		const text = this.source.substring(this.start, this.current);
		const type = this.keywords.get(text) ?? TokenType.IDENTIFIER;
		this.addToken(type);
	}

	private isAlpha(c: string): boolean {
		return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
	}

	private isDigit(c: string): boolean {
		return c >= "0" && c <= "9";
	}

	private isAlphaNumeric(c: string): boolean {
		return this.isAlpha(c) || this.isDigit(c);
	}

	private addToken(type: TokenType, literal: Object = {}) {
		const text = this.source.substring(this.start, this.current);
		this.tokens.push(new Token(type, text, literal, this.line));
	}
}
