const path = require('path');
const { runTests } = require('@vscode/test-electron');

runTests({
  extensionDevelopmentPath: path.resolve(__dirname, '..'),
  extensionTestsPath: path.resolve(__dirname, 'suite.js'),
  launchArgs: [path.resolve(__dirname, '..', '..', 'docs', 'samples'), '--disable-extensions'],
}).catch(() => process.exit(1));
