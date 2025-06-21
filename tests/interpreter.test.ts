import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { Interpreter, Scanner, Parser, Resolver } from "src";

describe("Interpreter", () => {
  let interpreter: Interpreter;
  let originalConsoleLog: typeof console.log;
  let logOutput: string[];

  beforeEach(() => {
    interpreter = new Interpreter();
    logOutput = [];
    originalConsoleLog = console.log;
    console.log = (...args) => {
      logOutput.push(args.join(' '));
    };
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  function interpretCode(source: string): void {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();
    const parser = new Parser(tokens);
    const statements = parser.parse();

    const resolver = new Resolver(interpreter);
    resolver.resolveStatements(statements);

    interpreter.interpret(statements);
  }

  test("interprets variable declaration and access", () => {
    interpretCode(`
      var a = 1;
      var b = 2;
      print a + b;
    `);

    expect(logOutput).toEqual(["3"]);
  });

  test("interprets control flow", () => {
    interpretCode(`
      var a = 10;
      if (a > 5) {
        print "greater";
      } else {
        print "smaller";
      }
    `);

    expect(logOutput).toEqual(["greater"]);
  });

  test("interprets functions", () => {
    interpretCode(`
      fun add(a, b) {
        return a + b;
      }
      print add(2, 3);
    `);

    expect(logOutput).toEqual(["5"]);
  });

  test("interprets closures", () => {
    interpretCode(`
      fun makeCounter() {
        var count = 0;
        fun counter() {
          count = count + 1;
          return count;
        }
        return counter;
      }

      var counter = makeCounter();
      print counter();
      print counter();
    `);

    expect(logOutput).toEqual(["1", "2"]);
  });

  test("interprets classes and methods", () => {
    interpretCode(`
      class Person {
        init(name) {
          this.name = name;
        }

        sayHello() {
          return "Hello, " + this.name + "!";
        }
      }

      var bob = Person("Bob");
      print bob.sayHello();
    `);

    expect(logOutput).toEqual(["Hello, Bob!"]);
  });

  test("interprets class inheritance", () => {
    interpretCode(`
      class Animal {
        init(name) {
          this.name = name;
        }

        speak() {
          return "I'm an animal.";
        }
      }

      class Dog < Animal {
        speak() {
          return "Woof!";
        }
      }

      var dog = Dog("Buddy");
      print dog.speak();
    `);

    expect(logOutput).toEqual(["Woof!"]);
  });

  test("saving instance context when binding method to a variable", () => {
    interpretCode(`
      class Person {
        init(name) {
          this.name = name;
        }

        sayHello() {
          return "Hello, " + this.name + "!";
        }
      }

      var fn = Person("Bob").sayHello;
      print fn();
    `);

    expect(logOutput).toEqual(["Hello, Bob!"]);
  });

});
