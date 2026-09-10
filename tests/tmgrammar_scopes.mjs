#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only
//
// tmgrammar_scopes.mjs — what the VS Code grammar leaves in the bare scope.
//
// The driver for ZyDDT's fifth surface. Like its sibling in `web/tests/`, it
// reports facts and grades nothing: whether an unscoped token is a finding is
// ZyDDT's question, and keeping the judgement in one place is what stops the
// rule existing twice.
//
// The method is CHARTER § 4, and the important half of it is *how*: tokenise
// with `vscode-textmate` over Oniguruma — **the real machinery**, not a regex
// approximation. A grammar is a stack of Oniguruma patterns with begin/end
// states, and an approximation of that is a second grammar with its own bugs;
// what it would grade is the approximation.
//
//   node tests/tmgrammar_scopes.mjs FILE.zy...
//
// Output, one line per run of characters that reached no scope of its own,
// tab-separated:
//
//   file<TAB>line<TAB>column<TAB>text
//
// Several files per invocation, and here it matters twice: node costs about
// eighty milliseconds to start and loading the Oniguruma WASM plus compiling
// the grammar costs more, so one process per file is the difference between
// two seconds and a minute over the sweep.
//
// "No scope of its own" means the token's scope stack is exactly
// `['source.zymbol']` — the grammar matched nothing and the character fell
// through to the file's own scope. Whitespace never counts.
//
// Exit 0 whatever it finds. A driver that exits non-zero on a finding makes
// "this file has an unscoped token" indistinguishable from "the driver could
// not run", and ZyDDT reads BLOCKED and RED as different things.

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// Both ship as CommonJS, so the namespace import lands under `.default` —
// destructure it rather than reaching for named exports that are not there.
import onigModule from 'vscode-oniguruma';
import tmModule from 'vscode-textmate';

const oniguruma = onigModule.default ?? onigModule;
const textmate  = tmModule.default  ?? tmModule;

const here = dirname(fileURLToPath(import.meta.url));
const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: tmgrammar_scopes.mjs FILE.zy...');
  process.exit(2);
}

const wasm = readFileSync(join(here, '..', 'node_modules', 'vscode-oniguruma', 'release', 'onig.wasm'));
await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));

const registry = new textmate.Registry({
  onigLib: Promise.resolve({
    createOnigScanner: patterns => new oniguruma.OnigScanner(patterns),
    createOnigString:  s        => new oniguruma.OnigString(s),
  }),
  loadGrammar: async scope =>
    scope === 'source.zymbol'
      ? textmate.parseRawGrammar(
          readFileSync(join(here, '..', 'syntaxes', 'zymbol.tmGrammar.json'), 'utf8'),
          'zymbol.tmGrammar.json')
      : null,
});

const grammar = await registry.loadGrammar('source.zymbol');
if (!grammar) {
  console.error('tmgrammar_scopes: could not load source.zymbol');
  process.exit(2);
}

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let stack = textmate.INITIAL;

  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    const result = grammar.tokenizeLine(line, stack);
    stack = result.ruleStack;

    // Adjacent unscoped tokens are one run: the grammar splits on its own
    // boundaries, and reporting `$`, `+`, `+` separately for one `$++` it
    // failed to recognise describes the splitting rather than the gap.
    let run = null;
    const flush = () => {
      if (run && run.text.trim() !== '')
        process.stdout.write(`${file}\t${n + 1}\t${run.col}\t${run.text}\n`);
      run = null;
    };

    for (const token of result.tokens) {
      const text = line.slice(token.startIndex, token.endIndex);
      const bare = token.scopes.length === 1 && token.scopes[0] === 'source.zymbol';
      if (bare && text.trim() !== '') {
        if (run) run.text += text;
        else run = { col: token.startIndex + 1, text };
      } else {
        flush();
      }
    }
    flush();
  }
}
