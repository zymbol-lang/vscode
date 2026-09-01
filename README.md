<p align="center">
  <img src="logo.png" alt="Zymbol-Lang" width="180"/>
</p>

<h1 align="center">Zymbol-Lang — VS Code Extension</h1>

<p align="center">
  Official Visual Studio Code extension for Zymbol-Lang.<br/>
  Syntax highlighting, full LSP client, 46 snippets, themes, file icons, formatter and runner.
</p>

<p align="center">
  <img alt="extension v0.1.5" src="https://img.shields.io/badge/extension-v0.1.5-informational?style=flat-square"/>
  <img alt="targets Zymbol v0.0.8" src="https://img.shields.io/badge/Zymbol-v0.0.8-7c3aed?style=flat-square"/>
  <img alt="TypeScript" src="https://img.shields.io/badge/language-TypeScript-blue?style=flat-square"/>
  <img alt="license AGPL-3.0" src="https://img.shields.io/badge/license-AGPL--3.0-blue?style=flat-square"/>
  <img alt="VS Code ^1.75.0" src="https://img.shields.io/badge/VS%20Code-%5E1.75.0-007ACC?style=flat-square"/>
</p>

> **Revisado para v0.0.8 — 2026-08-01** · extension **v0.1.5**

---

## What ships in the extension

| Contribution | Contents |
| --- | --- |
| Language | `zymbol`, `.zy`, with its own file icon |
| Grammar | TextMate grammar, `source.zymbol` — every operator family, including TUI, casts, format expressions, numeral modes and hot identifiers |
| Snippets | **46**, from `if` to a full `std/db` session |
| Themes | **Zymbol Dark** and **Zymbol Light**, tuned for symbolic code |
| Icon theme | **Zymbol File Icons** |
| Commands | 5, plus a status-bar item for the analyser |
| Settings | 8, plus `[zymbol]` editor defaults |
| LSP client | Talks to `zymbol-lsp` over stdio |

---

## Features

### Language Server Protocol

The client exposes everything `zymbol-lsp` advertises:

| Capability | Notes |
| --- | --- |
| **Diagnostics** | Errors and warnings as you type — full-document sync, plus on save |
| **Semantic highlighting** | Server-computed tokens layered over the TextMate grammar |
| **Completion** | Triggered by `.`, `:` and `$` — members, module paths, collection operators |
| **Signature help** | Triggered by `(` and `,`, re-triggered on each argument |
| **Hover** | Type information and documentation |
| **Go to definition** | `F12` |
| **Find references** | `Shift+F12` |
| **Rename symbol** | `F2`, with prepare-rename validation before the edit is applied |
| **Code actions** | Quick fixes, refactors, and extract refactors (`Ctrl+.`) |
| **Document symbols** | Outline view — `Ctrl+Shift+O` |
| **Workspace symbols** | Search across files — `Ctrl+T` |
| **Document formatting** | `Shift+Alt+F`, or on save |

Multi-root workspaces are supported; the server is notified when folders change.

### Syntax highlighting

| Category | Symbols |
|----------|---------|
| Control flow | `?` `_?` `_` `??` `@` `@!` `@>` `@:` |
| Match / lambda arrows | `=>` (fat arrow), `->` (lambda) |
| I/O | `>>` `<<` `><` `¶` `\\` |
| TUI / terminal | `>>!` `>>?` `>>~` `>>\|` `<<\|` `<<\|?` `@~` |
| Functions | `->` `<~` |
| Collections | `$#` `$+` `$-` `$?` `$??` `$[..]` `$^` `$^+` `$^-` `$>` `$\|` `$<` `$*` `$/` `$~~` `$++` |
| Modules | `#` `#>` `<#` `::` `.` `=>` |
| Errors | `!?` `:!` `:>` `$!` `$!!` `##Type` |
| Casts | `##.` `###` `##!` `##"` `##'` |
| Format | `#.N\|x\|` `#!N\|x\|` `#,\|x\|` `#^\|x\|` `#\|expr\|` `expr#?` |
| Base | `0b\|` `0o\|` `0d\|` `0x\|` |
| Numeral mode | `#०९#` and every other `#<zero><nine>#` pair, including Klingon pIqaD |
| Memory | `°name` (hot definition), `name\` (lifetime end) |
| Shell / script | `<\ cmd \>` `</ script.zy />` |

Identifiers are matched as full Unicode, so CJK, Devanagari, Arabic, Hangul and pIqaD
identifiers highlight exactly like ASCII ones.

### Snippets

46 snippets, grouped by what they build:

| Family | Prefixes |
| --- | --- |
| Control flow | `if` `ifelse` `ifelif` `match` `for` `while` `loop` `range` |
| Functions | `func` `lambda` `lambdablock` |
| I/O | `out` `in` `intyped` |
| TUI | `tui` `cls` `termsize` `key` `keynb` `outp` `outps` `outpc` `sleep` |
| Data | `arr` `ntuple` `meta` `repeat` `numeval` `sci` `comma` `hotacc` `hotpre` |
| Modules | `module` `import` `importalias` |
| Errors | `try` `tryfull` |
| Standard library | `stdmath` `stdrandom` `stdjson` `stdio` `stdnet` `stddb` `ioread` `dbconnect` |
| Misc | `//` |

`ioread` and `dbconnect` are not one-liners — they expand to a complete pattern
(soft-error check with `$!`; connect → exec → parameterized query → disconnect).

### Themes and icons

Two colour themes ship with the extension and are designed around symbolic code: because
Zymbol has no words in its grammar, the colour budget that a normal theme spends on
`if`/`while`/`return`
goes to operator *families* instead, so `$`-collection, `@`-loop and `>>`-I/O operators stay
distinguishable at a glance.

- **Zymbol Dark** — `Ctrl+K Ctrl+T` → Zymbol Dark
- **Zymbol Light**
- **Zymbol File Icons** — File Icon Theme → Zymbol File Icons

### Run and format

- `F5` — run the current `.zy` file (only bound while a `.zy` file has editor focus)
- `Shift+Alt+F` — format the current document through `zymbol fmt`
- Format on save — off by default, see `zymbol-lang.formatOnSave`

Running uses an integrated terminal by default and reuses it across runs; set
`zymbol-lang.runInTerminal` to `false` to capture output in the *Zymbol-Lang* output panel
instead.

---

## Requirements

- **VS Code** 1.75+
- **Zymbol-Lang CLI** (`zymbol` in `PATH`) — for running and formatting files
- **Zymbol-Lang LSP** (`zymbol-lsp` in `PATH`) — for diagnostics and every smart feature

The extension degrades cleanly: without `zymbol-lsp` you still get syntax highlighting,
snippets, themes and icons.

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

### From a published release (recommended)

Every release ships a `.vsix` plus its SHA256:

```bash
gh release download v0.1.5 -R zymbol-lang/vscode -p '*.vsix'
code --install-extension zymbol-lang-0.1.5.vsix
```

Or in VS Code: Extensions view → `...` → **Install from VSIX**.

### Building the `.vsix` yourself

```bash
git clone https://github.com/zymbol-lang/vscode.git
cd vscode
bash build-extension.sh
```

> **`build-extension.sh` is the only supported way to build.** It runs install →
> type-check → bundle → package in order and stamps the output filename with the version
> and a timestamp. Running `npm run compile`, `npm run bundle` or `vsce package` on their
> own skips steps and produces a package that may not match the source.

### Development mode

1. Clone the repo and open the folder in VS Code
2. Press `F5` to launch the Extension Development Host

---

## Configuration

Search for `Zymbol` in settings (`Ctrl+,`):

| Setting | Default | Description |
|---------|---------|-------------|
| `zymbol-lang.executablePath` | `zymbol` | Path to the Zymbol CLI |
| `zymbol-lang.lspPath` | `zymbol-lsp` | Path to the LSP server |
| `zymbol-lang.enableLsp` | `true` | Enable LSP features |
| `zymbol-lang.runInTerminal` | `true` | Run in a terminal instead of the output panel |
| `zymbol-lang.showOutputPanel` | `true` | Reveal the output panel when running |
| `zymbol-lang.formatOnSave` | `false` | Format Zymbol files on save |
| `zymbol-lang.formatter.indentSize` | `4` | Spaces per indent level, passed to `zymbol fmt --indent` |
| `zymbol-lang.trace.server` | `off` | LSP trace level (`off` / `messages` / `verbose`) |

The extension also sets editor defaults for `.zy` files: `tabSize` 4, spaces instead of
tabs, and itself as the default formatter. Override them per-workspace under `"[zymbol]"`.

---

## Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| `Zymbol-Lang: Run Zymbol-Lang File` | `F5` | Execute the current file |
| `Zymbol-Lang: Format Document` | `Shift+Alt+F` | Format through `zymbol fmt` |
| `Zymbol-Lang: Show Analyser Status` | — | Server state, also bound to the status-bar item |
| `Zymbol-Lang: Restart Language Server` | — | Restart `zymbol-lsp` |
| `Zymbol-Lang: Stop Language Server` | — | Stop it without disabling the extension |

A status-bar item on the left shows the analyser's state and opens **Show Analyser Status**
when clicked.

---

## Language Quick Reference

Every snippet below is executed against the interpreter before release — this section is
verified, not illustrative.

```zymbol
// Variables and constants
x = 42
PI := 3.14159

// Output — no auto-newline, ¶ is explicit
>> "Hello " name ¶

// Input
<< "Enter name: " name

// Control flow
? x > 0 { >> "positive" ¶ }
_? x < 0 { >> "negative" ¶ }
_ { >> "zero" ¶ }

// Match — arms use =>
grade = ?? score {
    90..100 => 'A'
    80..89  => 'B'
    _       => 'F'
}

// Loops
@ i:1..10 { >> i ¶ }
@ item:list { >> item ¶ }

// Functions and lambdas
add(a, b) { <~ a + b }
double = x -> x * 2

// Collections — 1-based indexing
arr = [1, 2, 3]
arr = arr$+ 4       // append
len = arr$#         // length
sub = arr$[1..2]    // slice → [1, 2]

// Error handling
!? { risky() }
:! ##IO { >> "file error" ¶ }
:! { >> _err ¶ }
:> { cleanup() }

// Modules — the alias is => and is mandatory
<# ./lib/math => m
>> m::sqrt(16) ¶
>> m.PI ¶
```

> Both `??` arms and module aliases changed from `:` and `<=` to `=>` in **v0.0.6**
> (2026-06-07). Code written against the older syntax does not parse — the interpreter
> reports `expected '=>' after pattern` and `expected '=>' for module alias`.

---

## Architecture

```
VS Code Extension (TypeScript, bundled with esbuild)
  ├── TextMate grammar   → syntax highlighting
  ├── Language client    → communicates with zymbol-lsp over stdio
  ├── Themes + icons     → Zymbol Dark / Light, Zymbol File Icons
  └── Commands           → run, format, restart / stop / status

zymbol-lsp (Rust)
  ├── tower-lsp          → LSP protocol layer
  ├── zymbol-analyzer    → document cache, symbol index, diagnostics
  └── zymbol-{lexer,parser,semantic,formatter}
```

---

## Troubleshooting

**LSP server not starting**

```bash
which zymbol-lsp        # check it is in PATH
zymbol-lsp --version    # verify it runs
```

Or set the full path in settings:

```json
"zymbol-lang.lspPath": "/path/to/zymbol-lsp"
```

Check the output panel: View → Output → **Zymbol-Lang LSP**.

**Diagnostics disagree with `zymbol check`**

Almost always two binaries. A previously installed `zymbol-lsp` (`/usr/bin`, `/usr/local/bin`)
shadows a freshly built one, so the editor reports errors from an older language version
while the CLI is current. Compare them:

```bash
which -a zymbol-lsp
zymbol-lsp --version
zymbol --version
```

They must be the same version. Then **Zymbol-Lang: Restart Language Server** — the server
is not restarted automatically when the binary on disk changes.

**Disable LSP (basic mode)**

```json
"zymbol-lang.enableLsp": false
```

---

## Known gaps

- **No `stdterm` snippet.** `std/term` (display width, padding, centring, truncation)
  arrived in language v0.0.8, after extension v0.1.5 was packaged. Import it by hand:
  `<# std/term => term`. Highlighting and LSP features are unaffected — the grammar does
  not special-case stdlib module names.

---

## Resources

- [Interpreter](https://github.com/zymbol-lang/interpreter) — Rust workspace, 19 crates
- [Website](https://zymbol-lang.org) · [Playground](https://zymbol-lang.org/playground.html) — run Zymbol in the browser, no install
- [Aprende Zymbol](https://zymbol-lang.github.io/aprende-zymbol/) — structured course, in Spanish
- [GUIDE.md](https://github.com/zymbol-lang/interpreter/blob/main/GUIDE.md) — the authoritative language reference

---

## Authorship & AI Collaboration

This extension is designed by **[OscarE.EspinozaB](https://github.com/zymbol-lang/interpreter/commits?author=OscarEEspinozaB)**, the author of Zymbol-Lang. Feature scope, LSP integration decisions, grammar design, and the verification process for each release are fully controlled by the author.

The implementation was built using **[Claude Code](https://claude.ai/code)** (Anthropic) as the engineering team, working from the author's specifications. This is transparent and intentional — AI accelerated delivery; it did not define the design.

---

## License

AGPL-3.0 — see [LICENSE](./LICENSE)
