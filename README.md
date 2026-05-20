<p align="center">
  <img src="logo.png" alt="Zymbol-Lang" width="180"/>
</p>

<h1 align="center">Zymbol-Lang — VS Code Extension</h1>

> **Revisado para v0.0.5 — 2026-05-12**

<p align="center">
  Official Visual Studio Code extension for Zymbol-Lang.<br/>
  Syntax highlighting, LSP support, snippets, formatter and runner.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/language-TypeScript-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square"/>
  <img src="https://img.shields.io/badge/VS%20Code-%5E1.75.0-007ACC?style=flat-square"/>
</p>

---

## Features

### Language Server Protocol (LSP)

- **Real-time diagnostics** — errors and warnings as you type
- **Semantic highlighting** — rich coloring for all 65+ operators
- **Go to definition** — jump to variable/function definitions (`F12`)
- **Find references** — all usages of a symbol (`Shift+F12`)
- **Document symbols** — outline view (`Ctrl+Shift+O`)
- **Hover information** — type info and docs on hover
- **Workspace symbol search** — find symbols across files (`Ctrl+T`)
- **Document formatting** — `Shift+Alt+F` or format on save

### Syntax Highlighting

Complete TextMate grammar covering all Zymbol-Lang constructs:

| Category | Symbols |
|----------|---------|
| Control flow | `?` `_?` `_` `??` `@` `@!` `@>` |
| I/O | `>>` `<<` `¶` |
| Functions | `->` `<~` |
| Collections | `$#` `$+` `$-` `$~` `$?` `$[..]` |
| Modules | `<#` `#` `#>` `::` `.` `<=` |
| Errors | `!?` `:!` `:>` `$!` `$!!` |
| Data | `#\|expr\|` `expr#?` `#^\|x\|` `#,\|x\|` `#,.N\|x\|` `#^!N\|x\|` |
| Base | `0b` `0o` `0d` `0x` |

### Code Snippets

| Prefix | Description |
|--------|-------------|
| `if` | If statement |
| `ifelse` | If-else statement |
| `match` | Match statement |
| `for` | For-each loop |
| `while` | While loop |
| `func` | Function declaration |
| `lambda` | Lambda expression |
| `try` | Error handling block |

### Run & Format

- `F5` — run current `.zy` file
- `Shift+Alt+F` — format current document
- Format on save (configurable)

---

## Requirements

- **VS Code** 1.75+
- **Zymbol-Lang CLI** (`zymbol` in PATH) — for running files
- **Zymbol-Lang LSP** (`zymbol-lsp` in PATH) — for diagnostics and smart features

### Install the interpreter

```bash
git clone https://github.com/zymbol-lang/interpreter.git
cd interpreter
cargo build --release
cp target/release/zymbol ~/.local/bin/
cp target/release/zymbol-lsp ~/.local/bin/
# or use the install script
bash install-zymbol.sh
```

---

## Installation

### From VSIX package

```bash
git clone https://github.com/zymbol-lang/vscode.git
cd vscode
npm install
npm run compile
npm run package
code --install-extension zymbol-lang-*.vsix
```

### Development mode

1. Clone this repo and open the folder in VS Code
2. Press `F5` to launch Extension Development Host

---

## Configuration

Search for `Zymbol` in VS Code settings (`Ctrl+,`):

| Setting | Default | Description |
|---------|---------|-------------|
| `zymbol-lang.executablePath` | `zymbol` | Path to Zymbol CLI |
| `zymbol-lang.lspPath` | `zymbol-lsp` | Path to LSP server |
| `zymbol-lang.enableLsp` | `true` | Enable LSP features |
| `zymbol-lang.runInTerminal` | `true` | Run in terminal vs output panel |
| `zymbol-lang.formatOnSave` | `false` | Auto-format on save |
| `zymbol-lang.formatter.indentSize` | `4` | Indent spaces |
| `zymbol-lang.trace.server` | `off` | LSP trace level (`off`/`messages`/`verbose`) |

---

## Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| `Zymbol-Lang: Run File` | `F5` | Execute the current file |
| `Zymbol-Lang: Restart Server` | — | Restart the LSP server |
| `Zymbol-Lang: Format Document` | `Shift+Alt+F` | Format the current file |

---

## Language Quick Reference

```zymbol
// Variables and constants
x = 42
PI := 3.14159

// Output (explicit newline with ¶)
>> "Hello " name ¶

// Input
<< "Enter name: " name

// Control flow
? x > 0 { >> "positive" ¶ }
_? x < 0 { >> "negative" ¶ }
_{ >> "zero" ¶ }

// Match
grade = ?? score {
    90..100 : 'A'
    80..89  : 'B'
    _       : 'F'
}

// Loops
@ i:1..10 { >> i ¶ }
@ item:list { >> item ¶ }

// Functions and lambdas
add(a, b) { <~ a + b }
double = x -> x * 2

// Collections
arr = [1, 2, 3]
arr = arr$+ 4       // append
len = arr$#         // length
sub = arr$[0..2]    // slice

// Error handling
!? { risky() }
:! ##IO { >> "file error" ¶ }
:! { >> _err ¶ }
:> { cleanup() }

// Modules
<# ./lib/math <= m
>> m::sqrt(16) ¶
```

---

## Architecture

```
VS Code Extension (TypeScript)
  ├── TextMate grammar   → syntax highlighting
  ├── Language client    → communicates with LSP via stdio
  └── Commands           → run, format, restart server

zymbol-lsp (Rust)
  ├── tower-lsp          → LSP protocol layer
  ├── zymbol-analyzer    → document cache, symbol index, diagnostics
  └── zymbol-{lexer,parser,semantic,formatter}
```

---

## Troubleshooting

**LSP server not starting:**
```bash
which zymbol-lsp        # check it's in PATH
zymbol-lsp --version    # verify it runs
```

Or set the full path in settings:
```json
"zymbol-lang.lspPath": "/path/to/zymbol-lsp"
```

Check the output panel: View → Output → Zymbol-Lang LSP

**Disable LSP (basic mode):**
```json
"zymbol-lang.enableLsp": false
```

---

## Resources

- [Interpreter](https://github.com/zymbol-lang/interpreter) — Rust workspace, 17 crates
- [Web](https://github.com/zymbol-lang/web) — landing page

---

## Authorship & AI Collaboration

This extension is designed by **[OscarE.EspinozaB](https://github.com/zymbol-lang/interpreter/commits?author=OscarEEspinozaB)**, the author of Zymbol-Lang. Feature scope, LSP integration decisions, grammar design, and the verification process for each release are fully controlled by the author.

The implementation was built using **[Claude Code](https://claude.ai/code)** (Anthropic) as the engineering team, working from the author's specifications. This is transparent and intentional — AI accelerated delivery; it did not define the design.

---

## License

AGPL-3.0 — see [LICENSE](./LICENSE)
