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

function updateStatusBar(text: string, tooltip?: string): void {
    if (!statusBarItem) { return; }
    statusBarItem.text = text;
    statusBarItem.tooltip = tooltip ?? 'Zymbol Analyser — click for status';
    statusBarItem.show();
}

/**
 * Locate the zymbol-lsp binary by searching common install locations.
 * Falls back to the configured value (for PATH-based lookup).
 */
function findServerPath(): string {
    const config = vscode.workspace.getConfiguration('zymbol-lang');
    const configuredPath = config.get<string>('lspPath', 'zymbol-lsp');

    // If the user gave an explicit absolute path and it exists, trust it
    if (path.isAbsolute(configuredPath) && fs.existsSync(configuredPath)) {
        return configuredPath;
    }

    const home = os.homedir();
    const candidates: string[] = [
        path.join(home, '.cargo', 'bin', 'zymbol-lsp'),
        path.join(home, '.local', 'bin', 'zymbol-lsp'),
        '/usr/local/bin/zymbol-lsp',
        '/usr/bin/zymbol-lsp',
    ];

    // Development workspace paths
    const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
    for (const folder of workspaceFolders) {
        const base = folder.uri.fsPath;
        candidates.push(
            path.join(base, '..', 'interpreter', 'target', 'release', 'zymbol-lsp'),
            path.join(base, 'interpreter', 'target', 'release', 'zymbol-lsp'),
            path.join(base, 'target', 'release', 'zymbol-lsp'),
        );
    }

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    // Fallback: let the OS resolve it from PATH
    return configuredPath;
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
            const executablePath = config.get<string>('executablePath', 'zymbol');
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
        const executablePath = config.get<string>('executablePath', 'zymbol');
        const runInTerminal = config.get<boolean>('runInTerminal', true);

        const filePath = document.uri.fsPath;

        if (runInTerminal) {
            const terminal = getOrCreateTerminal();
            terminal.show();
            terminal.sendText(`${executablePath} run "${filePath}"`);
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

    const serverPath = findServerPath();

    updateStatusBar('$(sync~spin) Zymbol', 'Zymbol Analyser: starting…');

    try {
        const serverOptions = {
            run: {
                command: serverPath,
                transport: TransportKind.stdio
            },
            debug: {
                command: serverPath,
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
                updateStatusBar('$(check) Zymbol', `Zymbol Analyser: running (${serverPath})`);
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
        const serverPath = findServerPath();
        const isRunning = client !== undefined;
        const serverExists = fs.existsSync(serverPath);

        const statusLines = [
            `**Zymbol Analyser**`,
            ``,
            `Server: \`${serverPath}\``,
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
