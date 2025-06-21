# Loxbun

[![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh)
[![Version](https://img.shields.io/badge/Version-0.0.1-red)](https://github.com/locwid/loxbun/releases)
[![Test coverage](https://img.shields.io/badge/Coverage-74.93-yellow)](https://github.com/locwid/loxbun/actions/workflows/test.yml)

> A TypeScript (Bun) implementation of the Lox programming language from [Crafting Interpreters](https://www.craftinginterpreters.com).

## Table of Contents

- [About](#about)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Cross-Platform Building](#cross-platform-building)

## About

Loxbun is an implementation of the Lox language described in the book [Crafting Interpreters](https://www.craftinginterpreters.com). While the original implementation in the book uses Java, this project is built with TypeScript using [Bun](https://bun.sh) as the runtime.

## Features

- [x] **Variables**
- [x] **Functions**
  - [x] Parameters
  - [x] Return values
  - [x] Scope
  - [x] Closures
- [x] **Control Flow**
- [x] **Loops**
- [ ] **Classes**
  - [x] Inheritance
  - [x] Methods
  - [x] Constructor
  - [ ] Static methods
- [ ] **Built-in Functions**
  - `print`
  - `clock`
- [ ] **Arrays**

## Installation

1. Make sure you have [Bun](https://bun.sh) installed on your system.

2. Clone this repository:
   ```
   git clone https://github.com/yourusername/loxbun.git
   cd loxbun
   ```

3. Install dependencies:
   ```
   bun install
   ```

4. Build the executable:
   ```
   bun run build
   ```

## Usage

### Running a Lox Script

To execute a Lox program file:

```
./out/loxbun <file_path>
```

### Using the REPL

For interactive development and testing, use the REPL (Read-Eval-Print Loop):

```
./loxbun
```

## Cross-Platform Building

Loxbun uses Bun's built-in bundling capabilities for building executables. To compile for different platforms, refer to [Bun's documentation on cross-compilation](https://bun.sh/docs/bundler/executables#cross-compile-to-other-platforms).
