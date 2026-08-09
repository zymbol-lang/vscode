import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Intentar cargar el cliente LSP de forma opcional
let LanguageClient: any;
let TransportKind: any;
let State: any;
let lspAvailable = false;

try {
    const lspModule = require('vscode-languageclient/node');
    LanguageClient = lspModule.LanguageClient;
    TransportKind = lspModule.TransportKind;
    State = lspModule.State;
    lspAvailable = true;
} catch (e) {
    console.log('vscode-languageclient not available, LSP features disabled');
}

/**
 * Symbol documentation for Zymbol-Lang operators and keywords
 * Used as fallback when LSP is not available
 */
const symbolDocumentation: Record<string, string> = {
    // Control Flow
    '?': '**IF** - Conditional statement\n\n```zymbol\n? condition {\n    >> "true branch" ¶\n}\n```',
    '_?': '**ELSE-IF** - Alternative conditional branch\n\n```zymbol\n? x > 10 {\n    >> "greater" ¶\n}\n_? x > 5 {\n    >> "medium" ¶\n}\n```',
    '_': '**ELSE** - Default conditional branch or match default case\n\n```zymbol\n? x > 0 {\n    >> "positive" ¶\n}\n_{\n    >> "non-positive" ¶\n}\n```',
    '??': '**MATCH** - Pattern matching statement\n\n```zymbol\nresult = ?? value {\n    1..10 : "low"\n    11..20 : "high"\n    _ : "other"\n}\n```',
    '@': '**LOOP** - Universal loop construct (infinite, while, or for-each)\n\n```zymbol\n@ i:1..10 {\n    >> i ¶\n}\n```',
    '@!': '**BREAK** - Exit current loop\n\n```zymbol\n@ i:1..100 {\n    ? i > 50 { @! }\n}\n```',
    '@>': '**CONTINUE** - Skip to next loop iteration\n\n```zymbol\n@ i:1..10 {\n    ? i % 2 == 0 { @> }\n    >> i ¶\n}\n```',

    // I/O Operators
    '>>': '**OUTPUT** - Display output (NO automatic newline)\n\n```zymbol\n>> "Hello " >> name ¶\n```',
    '<<': '**INPUT** - Read user input\n\n```zymbol\n<< "Enter name: " name\n<< age  // without prompt\n```',
    '¶': '**NEWLINE** - Explicit newline (pilcrow: AltGr+R)\n\n```zymbol\n>> "Line 1" ¶\n>> "Line 2" ¶\n```',
    '\\\\': '**NEWLINE** - Alternative explicit newline\n\n```zymbol\n>> "Line 1" \\\\\n>> "Line 2" \\\\\n```',

    // Function Operators
    '->': '**LAMBDA** - Lambda function definition\n\n```zymbol\ndouble = x -> x * 2\nadd = (a, b) -> a + b\n```',
    '<~': '**RETURN** - Return value from function (also used for output parameters)\n\n```zymbol\nfactorial = n -> {\n    ? n <= 1 {\n        <~ 1\n    }\n    <~ n * factorial(n - 1)\n}\n```',

    // Collection Operators
    '$#': '**COLLECTION LENGTH** - Get size/length of collection\n\n```zymbol\nlen = arr$#\nsize = text$#\n```',
    '$+': '**COLLECTION APPEND** - Add element to collection\n\n```zymbol\nresult = list$+ element\n```',
    '$-': '**COLLECTION REMOVE** - Remove element from collection\n\n```zymbol\nresult = list$- element\n```',
    '$~': '**COLLECTION UPDATE** - Update element at index\n\n```zymbol\narr$~ 0 $~ value\n```',
    '$?': '**COLLECTION CONTAINS** - Check if element exists\n\n```zymbol\nhas = list$? element\n```',
    '$[': '**COLLECTION SLICE** - Get subset of collection\n\n```zymbol\nsubset = arr$[0..5]\n```',

    // Module Operators
    '<#': '**IMPORT** - Import module\n\n```zymbol\n<# ./lib/math <= m\n```',
    '#': '**MODULE DECLARATION** - Declare current file as module\n\n```zymbol\n# my_module\n```',
    '#>': '**EXPORT** - Export items from module\n\n```zymbol\n#> { add, PI }\n```',
    '::': '**MODULE FUNCTION CALL** - Call function from module\n\n```zymbol\nresult = m::sqrt(16)\n```',

    // Data Operators
    '#?': '**TYPE METADATA** - Get type information\n\n```zymbol\ninfo = value#?\n```',
    '#|': '**NUMERIC EVALUATION** - Safe string-to-number conversion\n\n```zymbol\nnum = #|"123"|\n```',

    // Error Handling
    '!?': '**TRY** - Start try block\n\n```zymbol\n!? {\n    data = read_file("config.txt")\n}\n```',
    ':!': '**CATCH** - Catch block for errors\n\n```zymbol\n:! ##IO {\n    >> "File error" ¶\n}\n```',
    ':>': '**FINALLY** - Finally block (always executes)\n\n```zymbol\n:> {\n    cleanup()\n}\n```',
    '$!': '**ERROR CHECK** - Check if value is an error\n\n```zymbol\n? result$! { >> "Failed" ¶ }\n```',
    '$!!': '**ERROR PROPAGATE** - Propagate error to caller\n\n```zymbol\n? result$! { result$!! }\n```',

    // Booleans
    '#1': '**TRUE** - Boolean true value (language-agnostic)\n\n```zymbol\nactive = #1\n```',
    '#0': '**FALSE** - Boolean false value (language-agnostic)\n\n```zymbol\nactive = #0\n```',

    // Operators
    ':=': '**CONSTANT ASSIGNMENT** - Declare immutable constant\n\n```zymbol\nPI := 3.14159\n```',
    '|>': '**PIPE OPERATOR** - Function composition\n\n```zymbol\nresult = value |> double |> increment\n```',
    '..': '**RANGE OPERATOR** - Create numeric range\n\n```zymbol\n@ i:1..100 { }\n```',
    '&&': '**LOGICAL AND**\n\n```zymbol\n? x > 0 && x < 10 { }\n```',
    '||': '**LOGICAL OR**\n\n```zymbol\n? x == 0 || x == 1 { }\n```',
    '==': '**EQUAL** - Equality comparison\n\n```zymbol\n? x == 5 { }\n```',
    '<>': '**NOT EQUAL** - Inequality comparison\n\n```zymbol\n? x <> 0 { }\n```',
    '.': '**MEMBER ACCESS** - Access named tuple field or module member\n\n```zymbol\nvalue = person.name\n```'
};

// Language client instance
let client: any | undefined;

// Status bar item for LSP server state
let statusBarItem: vscode.StatusBarItem | undefined;

// Terminal instance for running files
let zymbolTerminal: vscode.Terminal | undefined;

// Where the extension reports which binaries it decided to use.
let extensionLog: vscode.OutputChannel | undefined;

function log(message: string): void {
    if (!extensionLog) {
        extensionLog = vscode.window.createOutputChannel('Zymbol-Lang');
    }
    extensionLog.appendLine(message);
}

/**
 * Report the binary the server is about to be started from, and its version.
 *
 * Which binary answers is not a detail: an installed copy one release behind
 * reports diagnostics the current sources do not produce, and nothing on screen
 * says so — a red squiggle looks the same whichever binary drew it. This is the
 * first thing to check when the editor and the CLI disagree.
 */
function reportServerBinary(command: string, args: string[]): void {
    log(`Language server: ${command} ${args.join(' ')}`.trimEnd());
    try {
        const cp = require('child_process');
        cp.execFile(command, ['--version'], { timeout: 5000 }, (err: any, stdout: string) => {
            log(err ? `  version: unavailable (${err.message})` : `  version: ${stdout.trim()}`);
        });
    } catch (e) {
        log(`  version: unavailable (${e})`);
    }
}

function updateStatusBar(text: string, tooltip?: string): void {
    if (!statusBarItem) { return; }
    statusBarItem.text = text;
    statusBarItem.tooltip = tooltip ?? 'Zymbol Analyser — click for status';
    statusBarItem.show();
}

/**
 * Locate the Zymbol server executable and decide how to invoke it.
 *
 * Returns `{ command, args }` where:
 *  - `zymbol lsp`    — preferred (one binary to install, cross-platform)
 *  - `zymbol-lsp`    — legacy standalone binary (kept for compatibility)
 *
 * Search order:
 *  1. Explicit `lspPath` setting (treated as the full binary path, no extra args)
 *  2. `zymbol` binary in common locations → invoked as `zymbol lsp`
 *  3. `zymbol-lsp` binary in common locations (legacy)
 *  4. PATH fallback: `zymbol lsp`
 */
function findServer(): { command: string; args: string[] } {
    const config = vscode.workspace.getConfiguration('zymbol-lang');
    const configuredPath = config.get<string>('lspPath', '');

    // Explicit absolute path wins (backward compat with old zymbol-lsp installs)
    if (configuredPath && path.isAbsolute(configuredPath) && fs.existsSync(configuredPath)) {
        return { command: configuredPath, args: [] };
    }

    for (const candidate of binaryCandidates('zymbol')) {
        if (fs.existsSync(candidate)) {
            return { command: candidate, args: ['lsp'] };
        }
    }

    // --- Legacy fallback: standalone zymbol-lsp binary ---
    for (const candidate of binaryCandidates('zymbol-lsp')) {
        if (fs.existsSync(candidate)) {
            return { command: candidate, args: [] };
        }
    }

    // PATH fallback — prefer zymbol lsp
    return { command: exeName('zymbol'), args: ['lsp'] };
}

/**
 * The file name of an executable on this platform.
 *
 * Windows needs the `.exe`, and needs it in two different ways. `fs.existsSync`
 * on a Windows path without it is simply false, so every candidate below used to
 * miss and the search fell through to the PATH — which meant a freshly built
 * `target\release\zymbol.exe` was never picked up, and the extension went on
 * talking to whatever version was installed. And `child_process.spawn` does not
 * apply PATHEXT, so spawning the bare name `zymbol` fails with ENOENT even when
 * `zymbol.exe` is on the PATH.
 */
function exeName(base: string): string {
    return process.platform === 'win32' ? `${base}.exe` : base;
}

/**
 * Where to look for `base`, in order: a build inside the open workspace first,
 * then the installed locations, and the PATH as a last resort.
 *
 * The workspace build winning is what makes "rebuild, restart the server, test
 * it" work without configuration. Someone with `interpreter/target/release/` in
 * their workspace is working on the interpreter and means that binary; a normal
 * user has no build tree at all, so for them the order changes nothing. The one
 * case it gets wrong is a stale forgotten build in the workspace — which is why
 * the chosen binary is now reported on startup instead of being invisible.
 */
function binaryCandidates(base: string): string[] {
    const home = os.homedir();
    const exe = exeName(base);
    const candidates: string[] = [];

    for (const folder of vscode.workspace.workspaceFolders ?? []) {
        const root = folder.uri.fsPath;
        candidates.push(
            path.join(root, 'interpreter', 'target', 'release', exe),
            path.join(root, '..', 'interpreter', 'target', 'release', exe),
            path.join(root, 'target', 'release', exe),
        );
    }

    candidates.push(
        path.join(home, '.cargo', 'bin', exe),
        path.join(home, '.local', 'bin', exe),
    );

    if (process.platform === 'win32') {
        // Where the .msi and the NSIS installer put it.
        for (const programFiles of [process.env.ProgramFiles, process.env['ProgramFiles(x86)']]) {
            if (programFiles) {
                candidates.push(path.join(programFiles, 'Zymbol-Lang', exe));
            }
        }
    } else {
        candidates.push(`/usr/local/bin/${exe}`, `/usr/bin/${exe}`);
    }

    return candidates;
}

/**
 * The CLI to run for `zymbol run` / `zymbol fmt`.
 *
 * The `executablePath` setting defaults to the bare name `zymbol`, which is not
 * something `spawn` can start on Windows. Resolving it to a real path keeps the
 * setting meaningful while making the default work on every platform, and avoids
 * `shell: true` — the workspace that prompted this hotfix lives in
 * `D:\OneDrive - Abastible S.A\...`, and handing a path with spaces to cmd.exe is
 * how quoting bugs are born.
 */
function findCli(): string {
    const configured = vscode.workspace.getConfiguration('zymbol-lang')
        .get<string>('executablePath', 'zymbol');

    if (configured && configured !== 'zymbol') {
        // An explicit setting is the user's business; honour it as written.
        return configured;
    }

    for (const candidate of binaryCandidates('zymbol')) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return exeName('zymbol');
}


/**
 * Document formatting provider for Zymbol-Lang (fallback when LSP is not available)
 * Uses the zymbol CLI formatter
 */
class ZymbolFormattingProvider implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.TextEdit[]> {
        return new Promise((resolve, reject) => {
            const config = vscode.workspace.getConfiguration('zymbol-lang');
            const executablePath = findCli();
            const indentSize = config.get<number>('formatter.indentSize', options.tabSize);

            const cp = require('child_process');
            const source = document.getText();

            // Run zymbol fmt with the source as stdin (using "-" for stdin)
            const process = cp.spawn(executablePath, ['fmt', '--indent', indentSize.toString(), '-'], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data: Buffer) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data: Buffer) => {
                stderr += data.toString();
            });

            process.on('close', (code: number) => {
                if (code === 0 && stdout) {
                    // Create a single edit that replaces the entire document
                    const fullRange = new vscode.Range(
                        document.positionAt(0),
                        document.positionAt(source.length)
                    );
                    resolve([vscode.TextEdit.replace(fullRange, stdout)]);
                } else {
                    // Check if error is about comments
                    if (stderr.includes('comments')) {
                        vscode.window.showWarningMessage(
                            'Cannot format: file contains comments that would be lost. Remove comments first.'
                        );
                    } else if (stderr) {
                        console.error('Formatter error:', stderr);
                    }
                    // Return empty edits on error (don't change the document)
                    resolve([]);
                }
            });

            process.on('error', (err: Error) => {
                console.error('Failed to run formatter:', err);
                resolve([]);
            });

            // Write the source to stdin
            process.stdin.write(source);
            process.stdin.end();
        });
    }
}

/**
 * Hover provider for Zymbol-Lang symbols (fallback when LSP is not available)
 */
class ZymbolHoverProvider implements vscode.HoverProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const range = document.getWordRangeAtPosition(position, /[?_@!>|#<~:.\-+*\/%&!=¶\\,\[\](){}$]+/);
        if (!range) {
            return null;
        }

        const word = document.getText(range);

        // Try exact match first
        if (symbolDocumentation[word]) {
            return new vscode.Hover(
                new vscode.MarkdownString(symbolDocumentation[word]),
                range
            );
        }

        // Check for multi-character operators
        const operators = ['??', '_?', '@!', '@>', '>>', '<<', '->', '<~', '<#', '#>', '::', '#?', '#|',
                          '!?', ':!', ':>', '$!', '$!!', '|>', '..', '&&', '||',
                          '==', '<>', '<=', '>=', '\\\\', '#1', '#0', '$#', '$+', '$-', '$~', '$?', '$[', ':='];

        for (const op of operators) {
            if (word.includes(op) && symbolDocumentation[op]) {
                return new vscode.Hover(
                    new vscode.MarkdownString(symbolDocumentation[op]),
                    range
                );
            }
        }

        return null;
    }
}

/**
 * Get or create a reusable terminal for Zymbol-Lang execution
 */
function getOrCreateTerminal(): vscode.Terminal {
    if (zymbolTerminal && vscode.window.terminals.includes(zymbolTerminal)) {
        return zymbolTerminal;
    }
    zymbolTerminal = vscode.window.createTerminal('Zymbol-Lang');
    return zymbolTerminal;
}

/**
 * Register the run command
 */
function registerRunCommand(context: vscode.ExtensionContext): vscode.Disposable {
    // Clean up terminal reference when terminals are closed
    context.subscriptions.push(
        vscode.window.onDidCloseTerminal((closedTerminal) => {
            if (closedTerminal === zymbolTerminal) {
                zymbolTerminal = undefined;
            }
        })
    );

    return vscode.commands.registerCommand('zymbol-lang.run', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'zymbol') {
            vscode.window.showErrorMessage('Current file is not a Zymbol-Lang file');
            return;
        }

        // Save the file first
        await document.save();

        const config = vscode.workspace.getConfiguration('zymbol-lang');
        const executablePath = findCli();
        const runInTerminal = config.get<boolean>('runInTerminal', true);

        const filePath = document.uri.fsPath;

        if (runInTerminal) {
            const terminal = getOrCreateTerminal();
            terminal.show();
            // The binary path is quoted too: it can now be an absolute path, and
            // "C:\Program Files\Zymbol-Lang\zymbol.exe" has a space in it.
            terminal.sendText(`"${executablePath}" run "${filePath}"`);
        } else {
            const outputChannel = vscode.window.createOutputChannel('Zymbol-Lang');
            outputChannel.show();
            outputChannel.clear();
            outputChannel.appendLine(`Running: ${filePath}`);

            const cp = require('child_process');
            const process = cp.spawn(executablePath, ['run', filePath]);

            process.stdout.on('data', (data: Buffer) => {
                outputChannel.append(data.toString());
            });

            process.stderr.on('data', (data: Buffer) => {
                outputChannel.append(data.toString());
            });

            process.on('close', (code: number) => {
                outputChannel.appendLine(`\nProcess exited with code ${code}`);
            });
        }
    });
}

/**
 * Start the language server client (non-blocking)
 */
function startLanguageClient(context: vscode.ExtensionContext): void {
    if (!lspAvailable) {
        console.log('LSP module not available, skipping');
        updateStatusBar('$(circle-slash) Zymbol', 'Zymbol Analyser: LSP module not available');
        return;
    }

    const config = vscode.workspace.getConfiguration('zymbol-lang');
    const enableLsp = config.get<boolean>('enableLsp', true);

    if (!enableLsp) {
        console.log('Zymbol-Lang LSP is disabled');
        updateStatusBar('$(circle-slash) Zymbol', 'Zymbol Analyser: disabled in settings');
        return;
    }

    const { command: serverCommand, args: serverArgs } = findServer();
    reportServerBinary(serverCommand, serverArgs);

    updateStatusBar('$(sync~spin) Zymbol', 'Zymbol Analyser: starting…');

    try {
        const serverOptions = {
            run: {
                command: serverCommand,
                args: serverArgs,
                transport: TransportKind.stdio
            },
            debug: {
                command: serverCommand,
                args: serverArgs,
                transport: TransportKind.stdio,
                options: {
                    env: {
                        ...process.env,
                        RUST_LOG: 'zymbol_lsp=debug',
                        RUST_BACKTRACE: '1'
                    }
                }
            }
        };

        const clientOptions = {
            documentSelector: [{ scheme: 'file', language: 'zymbol' }],
            synchronize: {
                fileEvents: vscode.workspace.createFileSystemWatcher('**/*.zy')
            },
            outputChannelName: 'Zymbol-Lang LSP'
        };

        client = new LanguageClient(
            'zymbol-lsp',
            'Zymbol-Lang Language Server',
            serverOptions,
            clientOptions
        );

        // Track server state in the status bar
        client.onDidChangeState((event: any) => {
            if (State && event.newState === State.Running) {
                updateStatusBar('$(check) Zymbol', `Zymbol Analyser: running (${serverCommand} ${serverArgs.join(' ')})`);
            } else if (State && event.newState === State.Stopped) {
                updateStatusBar('$(circle-slash) Zymbol', 'Zymbol Analyser: stopped');
            }
        });

        client.start().then(() => {
            console.log('Zymbol-Lang Language Server started');
        }).catch((error: any) => {
            console.error('Failed to start Zymbol-Lang Language Server:', error);
            updateStatusBar('$(error) Zymbol', `Zymbol Analyser: failed to start — ${error}`);
            client = undefined;
        });
    } catch (error) {
        console.error('Error creating LSP client:', error);
        updateStatusBar('$(error) Zymbol', `Zymbol Analyser: error — ${error}`);
        client = undefined;
    }
}

/**
 * Register restart server command
 */
function registerRestartCommand(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.commands.registerCommand('zymbol-lang.restartServer', async () => {
        if (!lspAvailable) {
            vscode.window.showWarningMessage('LSP is not available');
            return;
        }

        try {
            updateStatusBar('$(sync~spin) Zymbol', 'Zymbol Analyser: restarting…');
            if (client) {
                await client.stop();
                client = undefined;
            }
            startLanguageClient(context);
            vscode.window.showInformationMessage('Zymbol Analyser: server restarted');
        } catch (error) {
            updateStatusBar('$(error) Zymbol', `Zymbol Analyser: restart failed — ${error}`);
            vscode.window.showErrorMessage('Failed to restart Language Server');
        }
    });
}

/**
 * Register stop server command
 */
function registerStopCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('zymbol-lang.stopServer', async () => {
        if (client) {
            try {
                await client.stop();
                client = undefined;
                updateStatusBar('$(circle-slash) Zymbol', 'Zymbol Analyser: stopped');
                vscode.window.showInformationMessage('Zymbol Analyser: server stopped');
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to stop Language Server: ${error}`);
            }
        } else {
            vscode.window.showInformationMessage('Zymbol Analyser: server is not running');
        }
    });
}

/**
 * Register server status command (shown when clicking the status bar item)
 */
function registerStatusCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('zymbol-lang.serverStatus', async () => {
        const { command: serverCommand, args: serverArgs } = findServer();
        const serverLabel = serverArgs.length > 0
            ? `${serverCommand} ${serverArgs.join(' ')}`
            : serverCommand;
        const isRunning = client !== undefined;
        const serverExists = fs.existsSync(serverCommand);

        const statusLines = [
            `**Zymbol Analyser**`,
            ``,
            `Server: \`${serverLabel}\``,
            `Binary found: ${serverExists ? '$(check)' : '$(error) not found'}`,
            `Status: ${isRunning ? '$(check) running' : '$(circle-slash) stopped'}`,
        ];

        const action = await vscode.window.showInformationMessage(
            statusLines.filter(l => !l.startsWith('**') && l !== '').join('  |  ').replace(/\$\(\w[\w~]*\)\s*/g, ''),
            isRunning ? 'Restart' : 'Start',
            isRunning ? 'Stop' : undefined as any
        );

        if (action === 'Restart' || action === 'Start') {
            vscode.commands.executeCommand('zymbol-lang.restartServer');
        } else if (action === 'Stop') {
            vscode.commands.executeCommand('zymbol-lang.stopServer');
        }
    });
}

/**
 * Register format document command
 */
function registerFormatCommand(): vscode.Disposable {
    return vscode.commands.registerCommand('zymbol-lang.formatDocument', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'zymbol') {
            vscode.window.showErrorMessage('Current file is not a Zymbol-Lang file');
            return;
        }

        // Use VS Code's built-in format document command
        await vscode.commands.executeCommand('editor.action.formatDocument');
    });
}

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Zymbol-Lang extension is now active');

    // Create status bar item (always visible when a .zy file is open)
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
    statusBarItem.command = 'zymbol-lang.serverStatus';
    statusBarItem.tooltip = 'Zymbol Analyser — click for status';
    statusBarItem.text = '$(sync~spin) Zymbol';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register hover provider FIRST (always works)
    const hoverProvider = vscode.languages.registerHoverProvider(
        { language: 'zymbol', scheme: 'file' },
        new ZymbolHoverProvider()
    );

    // Register formatting provider (fallback when LSP is not available)
    const formattingProvider = vscode.languages.registerDocumentFormattingEditProvider(
        { language: 'zymbol', scheme: 'file' },
        new ZymbolFormattingProvider()
    );

    // Register commands FIRST (always works)
    const runCommand = registerRunCommand(context);
    const restartCommand = registerRestartCommand(context);
    const formatCommand = registerFormatCommand();
    const statusCommand = registerStatusCommand();
    const stopCommand = registerStopCommand();

    context.subscriptions.push(
        hoverProvider, formattingProvider,
        runCommand, restartCommand, formatCommand, statusCommand, stopCommand
    );

    // Start the language server AFTER commands are registered (non-blocking)
    startLanguageClient(context);

    // Watch for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(async (e) => {
            if (e.affectsConfiguration('zymbol-lang.lspPath') ||
                e.affectsConfiguration('zymbol-lang.enableLsp')) {
                try {
                    if (client) {
                        await client.stop();
                        client = undefined;
                    }
                    startLanguageClient(context);
                } catch (error) {
                    console.error('Error restarting LSP:', error);
                }
            }
        })
    );
}

/**
 * Extension deactivation
 */
export async function deactivate(): Promise<void> {
    statusBarItem?.hide();
    if (client) {
        try {
            await client.stop();
        } catch (error) {
            console.error('Error stopping LSP client:', error);
        }
    }
}
