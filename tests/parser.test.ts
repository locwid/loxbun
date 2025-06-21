import { expect, test, describe } from 'bun:test'
import { Scanner, Parser, TokenType } from 'src'
import {
  BlockStmt,
  ClsStmt,
  ConditionStmt,
  ExpressionStmt,
  FnStmt,
  PrintStmt,
  ReturnValStmt,
  VariableStmt,
  WhileLoopStmt,
} from 'src/codegen/Stmt'
import { LiteralExpr } from 'src/codegen/Expr'

describe('Parser', () => {
  test('parse variable statement with initializer', () => {
    const scanner = new Scanner('var x = 1;')
    const parser = new Parser(scanner.scanTokens())
    const statements = parser.parse()
    const statement = statements[0] as VariableStmt
    expect(statement).toBeInstanceOf(VariableStmt)
    expect(statement.name.type).toBe(TokenType.IDENTIFIER)
    expect(statement.name.lexeme).toBe('x')
    expect(statement.initializer).toBeInstanceOf(LiteralExpr)
    const expr = statement.initializer as LiteralExpr
    expect(expr.value).toBe(1)
  })

  test('parse variable statement with no initializer', () => {
    const scanner = new Scanner('var x;')
    const parser = new Parser(scanner.scanTokens())
    const statements = parser.parse()
    const statement = statements[0] as VariableStmt
    expect(statement).toBeInstanceOf(VariableStmt)
    expect(statement.name.type).toBe(TokenType.IDENTIFIER)
    expect(statement.name.lexeme).toBe('x')
    expect(statement.initializer).toBeNull()
  })

  test('parse block statement', () => {
    const scanner = new Scanner('{ var x = 1; }')
    const parser = new Parser(scanner.scanTokens())
    const statements = parser.parse()
    const statement = statements[0] as BlockStmt
    expect(statement).toBeInstanceOf(BlockStmt)
    expect(statement.statements.length).toBe(1)
    const variableStatement = statement.statements[0] as VariableStmt
    expect(variableStatement).toBeInstanceOf(VariableStmt)
    expect(variableStatement.name.type).toBe(TokenType.IDENTIFIER)
    expect(variableStatement.name.lexeme).toBe('x')
    expect(variableStatement.initializer).toBeInstanceOf(LiteralExpr)
    const expr = variableStatement.initializer as LiteralExpr
    expect(expr.value).toBe(1)
  })

  test('parse print statement', () => {
    const scanner = new Scanner('print 1;')
    const parser = new Parser(scanner.scanTokens())
    const statements = parser.parse()
    const statement = statements[0] as PrintStmt
    expect(statement).toBeInstanceOf(PrintStmt)
    expect(statement.expression).toBeInstanceOf(LiteralExpr)
    const expr = statement.expression as LiteralExpr
    expect(expr.value).toBe(1)
  })

  test('parse condition statement', () => {
    const scanner = new Scanner('if (true) { print 1; }')
    const parser = new Parser(scanner.scanTokens())
    const statements = parser.parse()
    const statement = statements[0] as ConditionStmt
    expect(statement).toBeInstanceOf(ConditionStmt)
    expect(statement.condition).toBeInstanceOf(LiteralExpr)
    const expr = statement.condition as LiteralExpr
    expect(expr.value).toBe(true)
    expect(statement.thenBranch).toBeInstanceOf(BlockStmt)
    const block = statement.thenBranch as BlockStmt
    expect(block.statements.length).toBe(1)
    const printStatement = block.statements[0] as PrintStmt
    expect(printStatement).toBeInstanceOf(PrintStmt)
    expect(printStatement.expression).toBeInstanceOf(LiteralExpr)
    const expr2 = printStatement.expression as LiteralExpr
    expect(expr2.value).toBe(1)
  })

  test('parse while statement', () => {
    const scanner = new Scanner('while (true) { print 1; }')
    const parser = new Parser(scanner.scanTokens())
    const statements = parser.parse()
    const statement = statements[0] as WhileLoopStmt
    expect(statement).toBeInstanceOf(WhileLoopStmt)
    expect(statement.condition).toBeInstanceOf(LiteralExpr)
    const expr = statement.condition as LiteralExpr
    expect(expr.value).toBe(true)
    expect(statement.body).toBeInstanceOf(BlockStmt)
    const block = statement.body as BlockStmt
    expect(block.statements.length).toBe(1)
    const printStatement = block.statements[0] as PrintStmt
    expect(printStatement).toBeInstanceOf(PrintStmt)
    expect(printStatement.expression).toBeInstanceOf(LiteralExpr)
    const expr2 = printStatement.expression as LiteralExpr
    expect(expr2.value).toBe(1)
  })

  test('parse function statement with zero parameters', () => {
    const scanner = new Scanner('fun foo() {}')
    const parser = new Parser(scanner.scanTokens())
    const statements = parser.parse()
    const statement = statements[0] as FnStmt
    expect(statement).toBeInstanceOf(FnStmt)
    expect(statement.name.lexeme).toBe('foo')
    expect(statement.params.length).toBe(0)
  })

  test('parse function statement with parameters', () => {
    const scanner = new Scanner('fun foo(a, b) {}')
    const parser = new Parser(scanner.scanTokens())
    const statements = parser.parse()
    const statement = statements[0] as FnStmt
    expect(statement).toBeInstanceOf(FnStmt)
    expect(statement.name.lexeme).toBe('foo')
    expect(statement.params.length).toBe(2)
    expect(statement.params[0]?.lexeme).toBe('a')
    expect(statement.params[1]?.lexeme).toBe('b')
  })

  test('parse return statement', () => {
    const scanner = new Scanner('fun foo() { return 1; }')
    const parser = new Parser(scanner.scanTokens())
    const statements = parser.parse()
    const statement = statements[0] as FnStmt
    expect(statement).toBeInstanceOf(FnStmt)
    expect(statement.name.lexeme).toBe('foo')
    expect(statement.params.length).toBe(0)
    const returnStatement = statement.body[0] as ReturnValStmt
    expect(returnStatement).toBeInstanceOf(ReturnValStmt)
    expect(returnStatement.value).toBeInstanceOf(LiteralExpr)
    const expr = returnStatement.value as LiteralExpr
    expect(expr.value).toBe(1)
  })

  test('parse class statement', () => {
    const scanner = new Scanner('class Foo {}')
    const parser = new Parser(scanner.scanTokens())
    const statements = parser.parse()
    const statement = statements[0] as ClsStmt
    expect(statement).toBeInstanceOf(ClsStmt)
    expect(statement.name.lexeme).toBe('Foo')
    expect(statement.methods.length).toBe(0)
  })

  test('parse class statement with methods', () => {
    const scanner = new Scanner('class Foo { method() {} }')
    const parser = new Parser(scanner.scanTokens())
    const statements = parser.parse()
    const statement = statements[0] as ClsStmt
    expect(statement).toBeInstanceOf(ClsStmt)
    expect(statement.name.lexeme).toBe('Foo')
    expect(statement.methods.length).toBe(1)
    const method = statement.methods[0] as FnStmt
    expect(method).toBeInstanceOf(FnStmt)
    expect(method.name.lexeme).toBe('method')
    expect(method.params.length).toBe(0)
    expect(method.body.length).toBe(0)
  })
})
