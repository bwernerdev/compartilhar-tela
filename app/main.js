'use strict';
/*
  App de desktop para quem APRESENTA na página Tela Compartilhada.
  Carrega a mesma página publicada e atende o getDisplayMedia() dela com um seletor próprio
  (desktopCapturer), então não aparece a barra do Chrome "… está compartilhando sua tela".
  Quem assiste continua usando só o link no navegador; o protocolo da sala não muda.
*/
const { app, BrowserWindow, Menu, desktopCapturer, dialog, clipboard, ipcMain, screen, session, shell } = require('electron');
const path = require('node:path');

const SITE_PADRAO = 'https://bwernerdev.github.io/compartilhar-tela/';
// --site=http://localhost:8765/ abre outra cópia da página (para testar mudanças antes de publicar)
const SITE = (process.argv.find(a => a.startsWith('--site=')) || '').slice(7) || SITE_PADRAO;
const CODIGO_RE = /#([a-z0-9]{24})$/;
const PERMITIDAS = new Set(['media', 'display-capture', 'fullscreen', 'clipboard-sanitized-write']);

let janela = null;
let pedido = null; // pedido de captura em andamento: { callback, audio, fontes, seletor }

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', (_e, argv) => {
  if (!janela) return;
  if (janela.isMinimized()) janela.restore();
  janela.focus();
  const sala = salaDe(argv);
  if (sala) janela.loadURL(SITE + '#' + sala);
});

function salaDe(args) {
  for (const a of args) { const m = String(a).trim().match(CODIGO_RE); if (m) return m[1]; }
  return '';
}
function doSite(url) { return url.startsWith(SITE) || url.startsWith('file:'); }
function abrirFora(url) { if (/^https?:\/\//i.test(url)) shell.openExternal(url); }

function criarJanela() {
  janela = new BrowserWindow({
    width: 1280, height: 800, minWidth: 480, minHeight: 520,
    title: 'Tela Compartilhada', backgroundColor: '#0f1115', show: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false },
  });
  janela.once('ready-to-show', () => janela.show());
  janela.on('closed', () => { janela = null; });

  const wc = janela.webContents;
  wc.on('will-navigate', (e, url) => { if (!doSite(url)) { e.preventDefault(); abrirFora(url); } });
  wc.setWindowOpenHandler(({ url }) => { abrirFora(url); return { action: 'deny' }; });
  wc.on('did-fail-load', (_e, codigo, descricao, url, principal) => {
    if (!principal || codigo === -3) return; // -3: carregamento interrompido por outro
    janela.loadFile(path.join(__dirname, 'erro.html'), { query: { u: url, d: descricao } });
  });

  const sala = salaDe(process.argv);
  janela.loadURL(SITE + (sala ? '#' + sala : ''));
}

// ---------- seletor de tela / janela ----------
function pedirTela(request, callback) {
  if (pedido) { // já tem um seletor aberto: traz para a frente e recusa o pedido repetido
    if (pedido.seletor && !pedido.seletor.isDestroyed()) pedido.seletor.focus();
    callback(null);
    return;
  }
  pedido = { callback, audio: !!request.audioRequested, fontes: new Map(), seletor: null };
  const pai = janela && !janela.isDestroyed() ? janela : null;
  const seletor = new BrowserWindow({
    parent: pai || undefined, modal: !!pai, width: 860, height: 640, minWidth: 560, minHeight: 420,
    title: 'Escolha o que apresentar', backgroundColor: '#1b1e24', autoHideMenuBar: true,
    minimizable: false, maximizable: false, show: false,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload-seletor.js'), contextIsolation: true, sandbox: true },
  });
  seletor.setMenu(null);
  pedido.seletor = seletor;
  seletor.once('ready-to-show', () => seletor.show());
  seletor.on('closed', () => responder(null));
  seletor.loadFile(path.join(__dirname, 'seletor.html'));
}

function responder(streams) {
  if (!pedido) return;
  const p = pedido; pedido = null;
  try { p.callback(streams); } catch (e) { console.error('captura:', e); }
  if (p.seletor && !p.seletor.isDestroyed()) p.seletor.destroy();
}

function doSeletor(e) { return pedido && pedido.seletor && !pedido.seletor.isDestroyed() && e.sender === pedido.seletor.webContents; }

ipcMain.handle('seletor:listar', async e => {
  if (!doSeletor(e)) return null;
  // telas com miniatura; janelas sem: no Windows a miniatura de janela trava ~5 s e volta vazia,
  // então o seletor tira a prévia de cada janela ele mesmo (captura curta, ver seletor.html)
  const [telasBrutas, janelas] = await Promise.all([
    desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 400, height: 250 } }),
    desktopCapturer.getSources({ types: ['window'], thumbnailSize: { width: 0, height: 0 }, fetchWindowIcons: true }),
  ]);
  const fontes = [...telasBrutas, ...janelas];
  if (!doSeletor(e)) return null;
  pedido.fontes = new Map(fontes.map(f => [f.id, f]));
  // as janelas do próprio app não entram na lista
  const proprias = new Set(BrowserWindow.getAllWindows().map(w => { try { return w.getMediaSourceId(); } catch { return ''; } }));
  const telas = fontes.filter(f => f.id.startsWith('screen:'));
  const principal = String(screen.getPrimaryDisplay().id);
  return {
    audio: pedido.audio,
    fontes: fontes.filter(f => !proprias.has(f.id)).map(f => {
      const tela = f.id.startsWith('screen:');
      const nome = !tela ? f.name
        : telas.length === 1 ? 'Tela inteira'
        : `Tela ${telas.indexOf(f) + 1}${f.display_id === principal ? ' (principal)' : ''}`;
      return {
        id: f.id, nome, tipo: tela ? 'tela' : 'janela',
        miniatura: f.thumbnail.isEmpty() ? '' : f.thumbnail.toDataURL(),
        icone: f.appIcon && !f.appIcon.isEmpty() ? f.appIcon.toDataURL() : '',
      };
    }),
  };
});
ipcMain.on('seletor:escolher', (e, id, comSom) => {
  if (!doSeletor(e)) return;
  const fonte = pedido.fontes.get(id);
  if (!fonte) { responder(null); return; }
  // "loopback" = todo o som que sai do Windows (só existe no Windows)
  const comAudio = comSom && pedido.audio && process.platform === 'win32';
  responder(comAudio ? { video: fonte, audio: 'loopback' } : { video: fonte });
});
ipcMain.on('seletor:cancelar', e => { if (doSeletor(e)) responder(null); });

// ---------- menu ----------
function entrarPeloLinkCopiado() {
  const sala = salaDe([clipboard.readText()]);
  if (!sala) {
    dialog.showMessageBox(janela, {
      type: 'info', title: 'Entrar numa sala', message: 'Nenhum link de sala copiado',
      detail: 'Copie o link da sala (Ctrl+C) e escolha de novo “Entrar pelo link copiado”.',
    });
    return;
  }
  janela.loadURL(SITE + '#' + sala);
}

function montarMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Sala', submenu: [
      { label: 'Entrar pelo link copiado', accelerator: 'Ctrl+Shift+V', click: entrarPeloLinkCopiado },
      { label: 'Criar uma sala nova', click: () => janela && janela.loadURL(SITE) },
      { type: 'separator' },
      { label: 'Recarregar', accelerator: 'F5', click: () => janela && janela.webContents.reload() },
      { type: 'separator' },
      { label: 'Sair', role: 'quit' },
    ] },
    { label: 'Editar', submenu: [
      { label: 'Desfazer', role: 'undo' }, { label: 'Refazer', role: 'redo' }, { type: 'separator' },
      { label: 'Recortar', role: 'cut' }, { label: 'Copiar', role: 'copy' }, { label: 'Colar', role: 'paste' },
      { label: 'Selecionar tudo', role: 'selectAll' },
    ] },
    { label: 'Ver', submenu: [
      { label: 'Tela cheia', role: 'togglefullscreen', accelerator: 'F11' },
      { label: 'Aumentar zoom', role: 'zoomIn', accelerator: 'Ctrl+=' },
      { label: 'Diminuir zoom', role: 'zoomOut' },
      { label: 'Zoom normal', role: 'resetZoom' },
      { type: 'separator' },
      { label: 'Ferramentas do desenvolvedor', role: 'toggleDevTools', accelerator: 'Ctrl+Shift+I' },
    ] },
  ]));
}

app.whenReady().then(() => {
  const ses = session.defaultSession;
  ses.setDisplayMediaRequestHandler(pedirTela);
  // só a página da sala ganha câmera/microfone, captura, tela cheia e área de transferência
  ses.setPermissionRequestHandler((wc, permissao, cb) => cb(PERMITIDAS.has(permissao) && doSite(wc.getURL())));
  montarMenu();
  criarJanela();
});
app.on('window-all-closed', () => app.quit());
