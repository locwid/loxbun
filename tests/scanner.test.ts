import { expect, test, describe } from "bun:test";
import { Scanner, TokenType } from "src";

describe("Scanner", () => {
	const scan = (source: string) => {
		const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();
    // Remove EOF
    return tokens.slice(0, -1);
	}

	test("scans EOF", () => {
		const scanner = new Scanner("");
    const tokens = scanner.scanTokens();
		expect(tokens.length).toBe(1);
		expect(tokens[0]?.type).toBe(TokenType.EOF);
	})

  test("scans single-character tokens correctly", () => {
  	const expected = [
	    TokenType.LEFT_PAREN,
	    TokenType.RIGHT_PAREN,
	    TokenType.LEFT_BRACE,
	    TokenType.RIGHT_BRACE,
	    TokenType.COMMA,
	    TokenType.DOT,
	    TokenType.MINUS,
	    TokenType.PLUS,
	    TokenType.SEMICOLON,
	    TokenType.STAR
	  ]
    const tokens = scan("(){},.-+;*")

    expect(tokens.length).toBe(expected.length);
    for (let i = 0; i < expected.length; i++) {
      expect(tokens[i]?.type).toBe(expected[i]!);
    }
  });

  test("scans one or two character tokens", () => {
	  const expected	= [
	    TokenType.BANG,
	    TokenType.BANG_EQUAL,
	    TokenType.EQUAL,
	    TokenType.EQUAL_EQUAL,
	    TokenType.GREATER,
	    TokenType.GREATER_EQUAL,
	    TokenType.LESS,
	    TokenType.LESS_EQUAL
	  ]
    const tokens = scan("! != = == > >= < <=")

    expect(tokens.length).toBe(expected.length);
    for (let i = 0; i < expected.length; i++) {
      expect(tokens[i]?.type).toBe(expected[i]!);
    }
  });

  test("scans literals correctly", () => {
    const tokens = scan(`"hello" 123.45 identifier`);

    expect(tokens.length).toBe(3);
    expect(tokens[0]?.type).toBe(TokenType.STRING);
    expect(tokens[0]?.literal).toBe("hello");
    expect(tokens[1]?.type).toBe(TokenType.NUMBER);
    expect(tokens[1]?.literal).toBe(123.45);
    expect(tokens[2]?.type).toBe(TokenType.IDENTIFIER);
    expect(tokens[2]?.lexeme).toBe("identifier");
  });

  test("scans keywords correctly", () => {
	  const expected = [
		   	TokenType.AND,
		   	TokenType.CLASS,
		   	TokenType.ELSE,
		   	TokenType.FALSE,
		   	TokenType.FUN,
		   	TokenType.FOR,
		   	TokenType.IF,
		   	TokenType.NIL,
		   	TokenType.OR,
		   	TokenType.PRINT,
		   	TokenType.RETURN,
		   	TokenType.SUPER,
		   	TokenType.THIS,
		   	TokenType.TRUE,
		   	TokenType.VAR,
		   	TokenType.WHILE,
	  ]
    const tokens = scan("and class else false fun for if nil or print return super this true var while")

    expect(tokens.length).toBe(expected.length);
    for (let i = 0; i < expected.length; i++) {
      expect(tokens[i]?.type).toBe(expected[i]!);
    }
  });

  test("ignores comments and whitespace", () => {
	  const expected = [
	    TokenType.VAR,
	    TokenType.IDENTIFIER,
	    TokenType.EQUAL,
	    TokenType.NUMBER,
	    TokenType.SEMICOLON,
	  ];
    const tokens = scan(`
      // This is a comment
      var x = 10; // This is another comment
    `);

    expect(tokens.length).toBe(expected.length);
    for (let i = 0; i < expected.length; i++) {
      expect(tokens[i]?.type).toBe(expected[i]!);
    }
  });
});
