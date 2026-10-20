'use strict';
// Gera build/icon.png (256×256) a partir do ícone da página. Rode com: npx electron build/gerar-icone.js
const { app, BrowserWindow } = require('electron');
const fs = require('node:fs');
const path = require('node:path');

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 24 24">
  <rect x="0.5" y="0.5" width="23" height="23" rx="5.5" fill="#8ab4f8"/>
  <g transform="translate(3.6 3.4) scale(0.7)" fill="none" stroke="#0b1b33" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4M12 13V8M9.5 10.5 12 8l2.5 2.5"/>
  </g></svg>`;

app.whenReady().then(async () => {
  const w = new BrowserWindow({ show: false });
  await w.loadURL('data:text/html,<canvas id="c" width="256" height="256"></canvas>');
  const png = await w.webContents.executeJavaScript(`new Promise(ok => {
    const img = new Image();
    img.onload = () => { const c = document.getElementById('c'); c.getContext('2d').drawImage(img, 0, 0, 256, 256); ok(c.toDataURL('image/png')); };
    img.src = 'data:image/svg+xml;base64,' + ${JSON.stringify(Buffer.from(SVG).toString('base64'))};
  })`);
  fs.writeFileSync(path.join(__dirname, 'icon.png'), Buffer.from(png.split(',')[1], 'base64'));
  app.quit();
});
