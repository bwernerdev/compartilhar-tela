# app/: mapa para o Claude

App Electron (Windows, .exe portátil) para quem **apresenta**. Ele carrega o **site publicado**
(`SITE_PADRAO` em `main.js`) e atende o `getDisplayMedia()` da página com um seletor próprio, então a
barra do Chrome "… está compartilhando sua tela" não aparece. Quem assiste usa só o navegador.

**Consequência:** mudanças no `index.html` chegam ao app sozinhas depois do push (cache de ~10 min).
Só gere outro .exe se mudar algum arquivo desta pasta.

## Arquivos
| Arquivo | Linhas | O que faz |
|---|---|---|
| `main.js` | ~180 | Janela principal, `setDisplayMediaRequestHandler(pedirTela)`, IPC do seletor, menu (Sala/Editar/Ver), permissões, instância única (um link aberto com o app já rodando vai para a janela existente) |
| `seletor.html` | ~170 | Seletor de tela/janela em pt-BR com abas Telas/Janelas, prévias e a caixa "Compartilhar o som do computador" |
| `preload-seletor.js` | 8 | Expõe `window.seletor.{listar, escolher(id, comSom), cancelar}` (contextBridge para ipcRenderer) |
| `erro.html` | ~30 | Página de "sem internet" (recebe `?u=&d=`), com CSP restrita |
| `package.json` | — | Electron 44.6.0 e electron-builder 26.15.3. Scripts: `start`, `dist` (portable x64), `icone` |
| `LEIA-ME.md` | — | Instruções para o usuário e para quem mexe no código |
| `build/` | — | Ícone (ver `build/CLAUDE.md`) |

## Pontos-chave de `main.js`
- `SITE` = `--site=<url>` ou o GitHub Pages. `doSite(url)` restringe navegação e permissões a ele.
- `PERMITIDAS` = `media`, `display-capture`, `fullscreen`, `clipboard-sanitized-write`. Câmera e microfone
  entram em `media`, então recursos novos da página nessa linha não pedem rebuild.
- **Fluxo da captura:** `pedirTela` abre o seletor modal. O seletor chama `seletor:listar`, que traz as
  telas com miniatura e as janelas sem ela (no Windows a miniatura de janela trava ~5 s; o seletor tira a
  prévia sozinho). Depois `seletor:escolher` → `responder({video, audio:'loopback'})`. O loopback só
  existe no Windows.
- As janelas do próprio app ficam fora da lista (comparação por `getMediaSourceId`).
- **Menu:** "Entrar pelo link copiado" (Ctrl+Shift+V) lê da área de transferência um link de sala.

## Gerar e publicar o .exe
- Dentro de `app/`: `npm install` (se o Electron não baixar: `node node_modules/electron/install.js`).
  Depois `npm run dist` → `dist/Tela Compartilhada.exe` (~90 MB).
- **Testar com a página local:** `npx electron . --site=http://localhost:8765/`.
- **Release:** a v1.0.0 está no GitHub (`gh release create`). Copie o exe para um nome sem espaços
  (`Tela-Compartilhada.exe`) antes do upload. `dist/` não vai para o git.
- O exe não é assinado, então o SmartScreen avisa ("Mais informações > Executar assim mesmo").
