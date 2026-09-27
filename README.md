# Big O Lens

Mostra, acima de cada função/método, a complexidade Big O **estimada** com um indicador de cor:
🟢 boa · 🟡 aceitável · 🔴 cara. Clique na anotação para ver o motivo (quais loops/chamadas dominam).

Linguagens: TypeScript, JavaScript, Java, Kotlin. Funciona no VSCode e no IntelliJ.

> É uma heurística (loops aninhados, recursão, custos conhecidos de `sort`/`indexOf`/`contains`…),
> não uma prova. Memoização, early-exit e custos amortizados podem enganar a estimativa.

## Instalação em rede corporativa (sem compilar)

Compilar exige acesso ao npm, ao Gradle e aos repositórios da JetBrains, que costumam ser
bloqueados. Em vez disso, baixe os instaladores prontos da **Release** deste repositório:

| Arquivo | Para |
|---|---|
| `big-o-lens-0.1.0.vsix` | VSCode |
| `lsp4ij-0.21.0.zip` | IntelliJ (dependência, instale **primeiro**) |
| `big-o-intellij-0.1.0.zip` | IntelliJ |

Único pré-requisito: **Node.js 18+ no PATH** (`node -v` no terminal). Nada é baixado em tempo de
execução e o servidor não abre portas de rede: VSCode fala com ele por IPC e o IntelliJ por stdin/stdout.

- **VSCode:** `code --install-extension big-o-lens-0.1.0.vsix`, ou *Extensions → ⋯ → Install from VSIX…*.
- **IntelliJ (2024.2+):** *Settings → Plugins → ⚙ → Install Plugin from Disk…*, primeiro
  `lsp4ij-0.21.0.zip`, depois `big-o-intellij-0.1.0.zip`, e reinicie a IDE.

Problemas comuns:
- *"Cannot start server"* no IntelliJ → o `node` não está no PATH que a IDE enxerga. Instale o Node
  e reinicie a IDE (no Windows, às vezes é preciso fazer logoff).
- Se a política da empresa bloquear plugins de fora do Marketplace, fale com o time de TI.

## Arquitetura

```
server/            Motor de análise + Language Server (Node/TypeScript, tree-sitter)
vscode-extension/  Cliente LSP fino para VSCode (CodeLens)
intellij-plugin/   Cliente LSP fino para IntelliJ via LSP4IJ (Code Vision)
docs/samples/      Exemplos anotados com `// @bigO <esperado>`, usados nos testes
```

Os dois clientes usam o `textDocument/codeLens` padrão do LSP; toda a lógica fica no `server/`.
Cada parser (tree-sitter) converte a sintaxe para uma IR comum (`server/src/ir.ts`), e
`server/src/analysis/heuristics.ts` estima a complexidade sobre essa IR.

## Desenvolvimento

Requisitos: Node 18+ (no PATH também em runtime), JDK 21.

```bash
cd server && npm install && npm test        # testes do motor contra docs/samples
```

### VSCode
```bash
cd vscode-extension && npm install
npm test                                     # abre um VSCode isolado e confere os CodeLens
npm run package                              # gera big-o-lens-0.1.0.vsix
code --install-extension big-o-lens-0.1.0.vsix
```
Ou abra `vscode-extension/` no VSCode e pressione F5.
Configurações: `bigO.thresholds.goodMax` e `bigO.thresholds.warnMax`.

### IntelliJ
```bash
cd server && npm run build                   # o plugin empacota server/dist
cd ../intellij-plugin
./gradlew runIde                             # IDE sandbox abrindo docs/samples
./gradlew buildPlugin                        # build/distributions/big-o-intellij-0.1.0.zip
```
Instale o zip em *Settings → Plugins → ⚙ → Install Plugin from Disk*. Depende do plugin
**LSP4IJ** (instalado automaticamente do Marketplace). Para compilar contra uma IDE já instalada, defina `localIde=<caminho>` em
`~/.gradle/gradle.properties` (fora do repositório); sem isso o IntelliJ IDEA 2026.2 é baixado.

## Adicionando um caso
Adicione uma função em `docs/samples/*` precedida por `// @bigO O(...)` e rode `npm test` em `server/`.
