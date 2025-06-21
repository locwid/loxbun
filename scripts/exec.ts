import { Lox } from 'src/Lox'

const lox = new Lox()
const args = Bun.argv

if (args.length > 3) {
  console.log('Usage: loxbun [script]')
  process.exit(64)
} else if (args[2]) {
  lox.runFile(args[2])
} else {
  lox.runPrompt()
}
