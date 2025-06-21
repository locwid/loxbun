import { expect, test, describe } from "bun:test";
import { Environment, Token, TokenType, RuntimeError } from "src";

describe("Environment", () => {
  test("defines and gets a variable", () => {
    const env = new Environment();
    env.define("x", 10);

    const token = new Token(TokenType.IDENTIFIER, "x", {}, 1);
    expect(env.get(token)).toBe(10);
  });

  test("assigns to existing variable", () => {
    const env = new Environment();
    env.define("x", 10);

    const token = new Token(TokenType.IDENTIFIER, "x", {}, 1);
    env.assign(token, 20);

    expect(env.get(token)).toBe(20);
  });

  test("throws error when getting undefined variable", () => {
    const env = new Environment();
    const token = new Token(TokenType.IDENTIFIER, "x", {}, 1);

    expect(() => env.get(token)).toThrow(RuntimeError);
  });

  test("throws error when assigning to undefined variable", () => {
    const env = new Environment();
    const token = new Token(TokenType.IDENTIFIER, "x", {}, 1);

    expect(() => env.assign(token, 10)).toThrow(RuntimeError);
  });

  test("handles nested environments", () => {
    const global = new Environment();
    global.define("x", 10);
    global.define("y", 20);

    const local = new Environment(global);
    local.define("z", 30);
    local.define("x", 40); // Shadows global x

    const tokenX = new Token(TokenType.IDENTIFIER, "x", {}, 1);
    const tokenY = new Token(TokenType.IDENTIFIER, "y", {}, 1);
    const tokenZ = new Token(TokenType.IDENTIFIER, "z", {}, 1);

    expect(local.get(tokenX)).toBe(40); // Gets local x
    expect(local.get(tokenY)).toBe(20); // Gets global y
    expect(local.get(tokenZ)).toBe(30); // Gets local z
    expect(global.get(tokenX)).toBe(10); // Gets global x
  });

  test("getAt and assignAt work correctly", () => {
    const global = new Environment();
    global.define("x", 10);

    const middle = new Environment(global);
    middle.define("y", 20);

    const local = new Environment(middle);
    local.define("z", 30);

    expect(local.getAt(0, "z")).toBe(30); // Local
    expect(local.getAt(1, "y")).toBe(20); // Middle
    expect(local.getAt(2, "x")).toBe(10); // Global

    local.assignAt(2, new Token(TokenType.IDENTIFIER, "x", {}, 1), 15);
    expect(local.getAt(2, "x")).toBe(15); // Updated global
  });
});
