import * as path from 'path';
import { ExtensionContext, workspace } from 'vscode';
import { LanguageClient, ServerOptions, TransportKind } from 'vscode-languageclient/node';

const LANGUAGES = ['typescript', 'typescriptreact', 'javascript', 'javascriptreact', 'java', 'kotlin'];

let client: LanguageClient | undefined;

function createClient(context: ExtensionContext): LanguageClient {
  const module = context.asAbsolutePath(path.join('dist', 'server', 'server.js'));
  const serverOptions: ServerOptions = {
    run: { module, transport: TransportKind.ipc },
    debug: { module, transport: TransportKind.ipc },
  };
  const config = workspace.getConfiguration('bigO');
  return new LanguageClient('bigO', 'Big O Lens', serverOptions, {
    documentSelector: [
      ...LANGUAGES.map((language) => ({ scheme: 'file', language })),
      { scheme: 'file', pattern: '**/*.{kt,kts}' },
    ],
    initializationOptions: {
      thresholds: { goodMax: config.get('thresholds.goodMax'), warnMax: config.get('thresholds.warnMax') },
    },
  });
}

export async function activate(context: ExtensionContext): Promise<void> {
  client = createClient(context);
  await client.start();
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(async (e) => {
      if (!e.affectsConfiguration('bigO')) return;
      await client?.stop();
      client = createClient(context);
      await client.start();
    }),
  );
}

export function deactivate(): Promise<void> | undefined {
  return client?.stop();
}
