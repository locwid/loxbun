import { Interpreter, type RuntimeError } from "./Interpreter";
import { Parser } from "./Parser";
import { Resolver } from "./Resolver";
import { Scanner } from "./Scanner";
import type { Token } from "./Token";
import { TokenType } from "./TokenType";

export class Lox {
	private static interpreter = new Interpreter();
	private static hadError = false;
	private static hadRuntimeError = false;

	public start(args: string[]) {
		if (args.length > 3) {
			console.log("Usage: loxbun [script]");
			process.exit(64);
		} else if (args[2]) {
			this.runFile(args[2]);
		} else {
			this.runPrompt();
		}
	}

	public static error(line: number, message: string) {
		Lox.report(line, "", message);
	}

	public static errorToken(token: Token, message: string) {
		if (token.type == TokenType.EOF) {
			this.report(token.line, " at end", message);
		} else {
			this.report(token.line, " at '" + token.lexeme + "'", message);
		}
	}

	public static runtimeError(error: RuntimeError) {
		console.error(`${error.message} \n[line ${error.token.line}]`);
		Lox.hadRuntimeError = true;
	}

	private static report(line: number, where: string, message: string) {
		console.error(`[line ${line}] Error${where}: ${message}`);
		this.hadError = true;
	}

	private run(source: string) {
		const scanner = new Scanner(source);
		const tokens = scanner.scanTokens();
		const parser = new Parser(tokens);
		const statements = parser.parse();

		if (Lox.hadError) {
			return;
		}

		const resolver = new Resolver(Lox.interpreter)
		resolver.resolveStatements(statements)

		if (Lox.hadError) {
			return;
		}

		Lox.interpreter.interpret(statements);
	}

	private async runFile(path: string) {
		const content = await Bun.file(path).text();
		this.run(content);
		if (Lox.hadError) process.exit(65);
		if (Lox.hadRuntimeError) process.exit(70);
	}

	private async runPrompt() {
		console.write("> ");
		for await (const line of console) {
			this.run(line);
			Lox.hadError = false;
			console.write("> ");
		}
	}
}
