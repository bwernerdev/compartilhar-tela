# Tela Compartilhada: app para quem apresenta

App de Windows para **apresentar** na página [Tela Compartilhada](https://bwernerdev.github.io/compartilhar-tela/)
sem a barra do Chrome “… está compartilhando sua tela / Parar de compartilhar / Ocultar”.

Nenhuma página web consegue esconder essa barra, porque é uma proteção do navegador. O app abre a mesma página
dentro de uma janela própria (Electron) e responde ele mesmo ao pedido de captura de tela. Por isso a barra não aparece.

**Quem assiste não precisa do app.** Continua abrindo o link no navegador, como sempre.

## Como usar

1. Abra `dist\Tela Compartilhada.exe`. Ele é portátil: não instala nada, é só dar dois cliques
   (leva uns 8 segundos para abrir, porque se descompacta numa pasta temporária). Dá para copiar o .exe para
   onde quiser, por exemplo a Área de Trabalho.
   Na primeira vez o Windows pode mostrar “O Windows protegeu o computador”, porque o app não tem assinatura digital.
   Clique em **Mais informações** e depois em **Executar assim mesmo**.
2. A página é a mesma do navegador. Digite seu nome, clique em **Criar sala** e mande o link para quem vai assistir.
3. Clique em **Apresentar**. Abre o seletor do app:
   - **Tela inteira**: um monitor inteiro (com dois monitores, aparecem “Tela 1 (principal)” e “Tela 2”).
   - **Janela**: uma janela só. As prévias aparecem em alguns segundos. Janela minimizada fica “Sem prévia”.
   - **Compartilhar o som do computador** (marcado por padrão) envia todo o som que sai do Windows.
4. Para parar, clique em **Parar de apresentar**, saia da sala ou feche o app.

### Entrar numa sala que outra pessoa criou

Copie o link da sala (Ctrl+C) e, no app, use **Sala → Entrar pelo link copiado** (Ctrl+Shift+V).
Também dá para passar o link ao abrir o app: `"Tela Compartilhada.exe" "https://…#codigo"`.

### Menu

- **Sala**: entrar pelo link copiado, criar uma sala nova, recarregar (F5), sair.
- **Ver**: tela cheia (F11), zoom e ferramentas do desenvolvedor (Ctrl+Shift+I).

## Bom saber

- **O som vai inteiro.** Diferente do Chrome, que manda só o som de uma aba, o app manda o som do PC todo,
  mesmo quando você escolhe uma janela só. Isso inclui notificações e, se alguém ligar o microfone na sala,
  a voz dessa pessoa tocando no seu PC (ela pode ouvir um eco de si mesma).
  Se isso atrapalhar, desmarque **Compartilhar o som do computador** no seletor.
- **A página vem da internet.** O app carrega `https://bwernerdev.github.io/compartilhar-tela/`. Quando a página
  é atualizada no GitHub Pages, o app já pega a versão nova, sem precisar gerar outro .exe.
  Sem internet, aparece “Não foi possível abrir a página”, com um botão para tentar de novo.
- **Seu nome e a qualidade escolhida** ficam guardados em `%APPDATA%\Tela Compartilhada`, separados do Chrome.
- O app só abre uma janela. Abrir o .exe de novo traz a janela que já está aberta para a frente.
- Links para outros sites abrem no seu navegador padrão.

## Para quem mexe no código

Arquivos nesta pasta (`app\`):

| Arquivo | O que faz |
|---|---|
| `main.js` | Abre a página, trata o `getDisplayMedia()` com `session.setDisplayMediaRequestHandler` + `desktopCapturer`, menu e permissões |
| `seletor.html`, `preload-seletor.js` | O seletor de tela/janela em português, com prévias |
| `erro.html` | Página de quando não há internet |
| `build\gerar-icone.js` | Gera `build\icon.png` (o mesmo desenho do ícone da página) |

O protocolo da sala (PeerJS, código depois do `#`, mensagens `hello`/`state`/`present`/`chat`/`bye`) é o da página.
O app não muda nada nele.

### Rodar e gerar o .exe

Precisa do Node.js. No PowerShell, dentro da pasta `app`:

```bash
npm install
```

Se o npm avisar que bloqueou scripts de instalação, baixe o Electron à mão:

```bash
node node_modules/electron/install.js
```

Rodar sem gerar o .exe:

```bash
npm start
```

Testar com uma cópia local da página (por exemplo, servida com `python -m http.server 8765` na pasta de cima):

```bash
npx electron . --site=http://localhost:8765/
```

Gerar o `dist\Tela Compartilhada.exe` (portátil, cerca de 90 MB):

```bash
npm run dist
```

### Detalhes técnicos

- O som do PC usa `audio: 'loopback'` do Electron, que só existe no Windows.
- No Windows, a miniatura de janela do `desktopCapturer` trava uns 5 s e volta vazia. Por isso o seletor pede
  a lista de janelas sem miniatura (é rápido) e tira a prévia de cada janela ele mesmo: captura um quadro com
  `getUserMedia` e fecha a captura logo em seguida. As telas inteiras usam a miniatura normal.
- As janelas do próprio app não aparecem no seletor.
- Só a página da sala recebe permissão de microfone, captura, tela cheia e área de transferência.
