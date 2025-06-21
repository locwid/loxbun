import { expect, test, describe, beforeEach, afterEach } from 'bun:test'
import path from 'path'
import { Lox } from 'src'

describe('Integration Tests', () => {
  let originalConsoleLog: typeof console.log
  let logOutput: string[]

  beforeEach(() => {
    logOutput = []
    originalConsoleLog = console.log
    console.log = (...args) => {
      logOutput.push(args.join(' '))
    }
  })

  afterEach(() => {
    console.log = originalConsoleLog
  })

  async function runScript(filename: string): Promise<string[]> {
    const lox = new Lox()
    const scriptPath = path.join(import.meta.dir, '../test-scripts', filename)
    const content = await Bun.file(scriptPath).text()
    lox.run(content)
    return logOutput
  }

  test('variables.lox produces correct output', async () => {
    const output = await runScript('variables.lox')
    expect(output).toEqual([
      'inner a',
      'outer b',
      'global c',
      'outer a',
      'outer b',
      'global c',
      'global a',
      'global b',
      'global c',
    ])
  })

  test('control_flow.lox produces correct output', async () => {
    const output = await runScript('control_flow.lox')
    expect(output).toEqual([
      'condition is true',
      '0',
      '1',
      '2',
      '3',
      '4',
      '0',
      '1',
      '2',
    ])
  })

  test('functions.lox produces correct output', async () => {
    const output = await runScript('functions.lox')
    expect(output).toEqual([
      '1',
      '2',
      '3',
      '0',
      '1',
      '1',
      '2',
      '3',
      '5',
      '8',
      '13',
      '21',
      '34',
      '1',
      '2',
    ])
  })

  test('classes.lox produces correct output', async () => {
    const output = await runScript('classes.lox')
    expect(output).toEqual([
      'My name is Bob',
      'My name is Alice',
      'My title is Engineer',
    ])
  })
})
