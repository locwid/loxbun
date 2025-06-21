# loxbun

An implementation of the Lox language described in [this book](https://www.craftinginterpreters.com).

The original uses Java, but I made mine in TypeScript (Bun).

## Features

- [x] Variables
- [x] Functions
	- [x] Parameters
	- [x] Return values
	- [x] Scope
	- [x] Closures
- [x] Control Flow
- [x] Loops
- [ ] Classes
	- [x] Inheritance
	- [x] Methods
	- [x] Constructor
	- [ ] Static	methods
- [x] Built-in Functions
	- [x] `print`
	- [x] `clock`
- [ ] Arrays


## Usage

Install dependencies:

```
bun install
```

Build executable:

```
bun run build
```

Run:

```
./out/loxbun <file_path>
```
or use REPL:

```
./loxbun
```
