const path = require('path');
const vscode = require('vscode');

const SAMPLES = path.resolve(__dirname, '..', '..', 'docs', 'samples');

async function lensesFor(file) {
  const doc = await vscode.workspace.openTextDocument(path.join(SAMPLES, file));
  await vscode.window.showTextDocument(doc);
  for (let i = 0; i < 60; i++) {
    const lenses = await vscode.commands.executeCommand('vscode.executeCodeLensProvider', doc.uri);
    const ours = (lenses || []).filter((l) => l.command && l.command.command === 'bigO.explain');
    if (ours.length) return ours;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no Big O lenses for ${file}`);
}

exports.run = async () => {
  for (const file of ['sample.ts', 'Sample.java', 'Sample.kt']) {
    const lenses = await lensesFor(file);
    console.log(`${file}: ${lenses.length} lenses`);
    for (const l of lenses.slice(0, 4)) console.log(`  L${l.range.start.line + 1} ${l.command.title}`);
  }
};
