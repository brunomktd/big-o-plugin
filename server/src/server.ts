import {
  CodeLens,
  createConnection,
  MessageType,
  ProposedFeatures,
  ShowMessageNotification,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { analyze, LanguageKey, languageForPath } from './analyze';
import { describe, label } from './analysis/complexity';
import { DEFAULT_THRESHOLDS, parseThresholds, severity, SEVERITY_ICON, Thresholds } from './analysis/severity';

const EXPLAIN = 'bigO.explain';

const LANGUAGE_IDS: Record<string, LanguageKey> = {
  javascript: 'javascript', javascriptreact: 'javascript', typescript: 'typescript',
  typescriptreact: 'tsx', java: 'java', kotlin: 'kotlin',
};

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const cache = new Map<string, { version: number; lenses: Promise<CodeLens[]> }>();
let thresholds: Thresholds = DEFAULT_THRESHOLDS;

connection.onInitialize((params) => {
  thresholds = parseThresholds(params.initializationOptions?.thresholds);
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      codeLensProvider: { resolveProvider: false },
      executeCommandProvider: { commands: [EXPLAIN] },
    },
  };
});

async function computeLenses(doc: TextDocument, key: LanguageKey): Promise<CodeLens[]> {
  const reports = await analyze(doc.getText(), key);
  return reports.map((r) => {
    const title = `${SEVERITY_ICON[severity(r.complexity, thresholds)]} ${label(r.complexity)} · ${describe(r.complexity)}`;
    const position = { line: r.line, character: r.character };
    return {
      range: { start: position, end: position },
      command: { title, command: EXPLAIN, arguments: [r.name, title, r.reasons] },
    };
  });
}

connection.onCodeLens(({ textDocument }) => {
  const doc = documents.get(textDocument.uri);
  const key = doc && (languageForPath(doc.uri) ?? LANGUAGE_IDS[doc.languageId]);
  if (!doc || !key) return [];
  const hit = cache.get(doc.uri);
  if (hit?.version === doc.version) return hit.lenses;
  const lenses = computeLenses(doc, key);
  cache.set(doc.uri, { version: doc.version, lenses });
  return lenses;
});

connection.onExecuteCommand(({ command, arguments: args }) => {
  if (command !== EXPLAIN || !args) return;
  const [name, title, reasons] = args as [string, string, string[]];
  const detail = reasons.length ? reasons.join('; ') : 'nenhum loop, recursão ou operação custosa encontrada';
  connection.sendNotification(ShowMessageNotification.type, {
    type: MessageType.Info,
    message: `${name}(): ${title} — ${detail}. (Estimativa heurística.)`,
  });
});

documents.onDidClose((e) => cache.delete(e.document.uri));
documents.listen(connection);
connection.listen();
