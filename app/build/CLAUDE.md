# app/build/: mapa para o Claude

Recursos de build do electron-builder (`directories.buildResources` no `package.json`).

| Arquivo | O que é |
|---|---|
| `icon.png` | Ícone 256×256 do app e do .exe (o mesmo desenho do ícone da página: tela com seta, fundo `#8ab4f8`) |
| `gerar-icone.js` | Script Electron que desenha o SVG num canvas e grava `icon.png`. Rodar de `app/` com `npm run icone` |

Para trocar o ícone, edite a constante `SVG` em `gerar-icone.js`, rode `npm run icone` e depois `npm run dist`.
Não abra o `icon.png` para "ler": é binário.
