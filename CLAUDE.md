# Tela Compartilhada: mapa para o Claude

Leia isto antes de abrir o código: o `index.html` tem ~1650 linhas. Use os nomes de função abaixo
com Grep (`function nome`) e leia só o trecho necessário. Instruções para o usuário ficam em
`LEIA-ME.md`, não aqui.

## O que é
Compartilhamento de tela estilo Google Meet num arquivo só (`index.html`), sem build e sem servidor
próprio. Publicado no GitHub Pages: https://bwernerdev.github.io/compartilhar-tela/
(repo público `bwernerdev/compartilhar-tela`, branch `main`, raiz). O usuário fala pt-BR, então
textos de interface, comentários e commits são em português.

## Pastas
| Pasta | O que tem | Doc |
|---|---|---|
| `/` | `index.html` (a página inteira: HTML + CSS + JS), `LEIA-ME.md` (para o usuário) | este arquivo |
| `app/` | App Electron (.exe) para **apresentar** sem a barra de aviso do Chrome. Carrega o site publicado | `app/CLAUDE.md` |
| `app/build/` | Ícone do app e o script que gera o ícone | `app/build/CLAUDE.md` |
| `app/dist/`, `app/node_modules/` | Gerados, ignorados pelo git. Não ler. | — |

## Stack e dependências
- PeerJS 1.5.4 via unpkg com SRI (sinalização pelo broker público `0.peerjs.com`).
- WebRTC em malha (cada pessoa liga para cada pessoa). Sem framework, sem bundler.
- STUN do Google e da Cloudflare, e TURN do ExpressTURN (`free.expressturn.com:3478`), com credenciais
  fixas no topo do script (`const TURN`). O usuário decidiu manter assim. Só UDP funciona no plano
  grátis (TCP dá 401). Esconder a senha exigiria o TURN da Cloudflare (Worker com credenciais temporárias).

## Mapa do `index.html` (seções do script, na ordem)
- **Constantes:** `TURN`, `ICE`, `PEER_OPTS`, `QUALITY` (nitidez/fluidez), `SCREEN_AUDIO_BITRATE`,
  `PROTO` (versão do protocolo, hoje 2), `CODE_RE`, e o estado global `S`.
- **utilidades:** `store`/`load` (localStorage com try), `newCode` (24 caracteres, ~120 bits),
  `hostIdFor` (SHA-256 do código, vira o id da porta), `cleanName`, `toast`, `setStatus`, `copyLink`.
- **telas:** `show(lobby|waiting|ended|room)`, `setupLobby`, `ended`, `setWaiting`, `goNewRoom`.
- **entrar / sair:** `enterRoom(create)`, `openPeer`, `onPeerError`, `onNoDoor`, `knock`,
  `knockFailed`, `onDoorReply`, `becomeHost`, `openDoor`, `closeDoor`, `onKnock`, `admit`,
  `denyKnock`, `broadcastRoom`, `setApproval`, `kickMember`, `electHost`, `leaveRoom`.
- **conexões de dados:** `connectTo`, `hello`, `send`, `broadcast`, `broadcastState`, `setupConn`,
  `acceptHello`, `onData` (switch de mensagens), `removeMember`.
- **mídia:** `callMember`, `closeOut`, `onCall`, `acceptCall`, `attachAudio`, `hifiAudio`,
  `screenSdp` (H.264 primeiro, bitrate inicial), `tuneSender`/`tuneCall`/`retuneAll` (bitrate e
  `degradationPreference`), `setQuality`, `dropAudio`, `startPresenting`, `stopPresenting`,
  `toggleMic`, `toggleCam`, `stopCam`.
- **tela cheia / painel / chat:** `toggleFullscreen`, `openPanel`, `addChat`, `addSystem`, `appendMsg`.
- **imagens no chat:** `sendImage`, `shrinkImage` (até 1920 px, WebP), `onImagePart`, `openLightbox`.
- **desenho:** `render` (chamado a cada mudança de estado), `renderLabel`, `renderCams`,
  `renderPeople`/`makeRow` (linhas persistentes em `S.rows`), `paintNet`.
- **quem está falando:** `startAudio`, `stopAudio`, `watchLevel`, `unwatchLevel`, `tickLevels`,
  `setSpeaking` (AnalyserNode, intervalo de 150 ms).
- **qualidade da conexão:** `updateNet` (getStats a cada 2 s: direta ou TURN, RTT, resolução, perda).
- **pedidos para entrar:** `renderKnocks`. Depois vêm os handlers de janela flutuante e volume da tela.

## Protocolo da sala (PROTO = 2)
- Cada pessoa tem um peer principal com id aleatório. A **porta** da sala é um segundo Peer com id
  `hostIdFor(code)`, aberto só pelo anfitrião atual.
- **Quem chega:** conecta na porta e manda `knock{v,code,name}`. A porta responde `wait`, `welcome{host,
  approval,ids}`, `deny` ou `old` (versão diferente). Com o `welcome`, a pessoa conecta em cada id.
- **Malha:** quem liga manda `hello{v,code,name,at,mic,cam,presenting}`. Quem recebe só aceita se o id
  estiver em `S.admitted`, que é preenchido pela mensagem `admit{id}` do anfitrião. Até lá, guarda o
  `pendingHello`.
- **Mensagens de membro (`onData`):** `admit`, `room{host,approval}`, `kick{id}`, `state`,
  `present`, `chat`, `img{id,i,n,d}` (pedaços de ≤15 000 caracteres), `bye`.
- **Mídia:** `peer.call` com `metadata.kind` = `screen`, `mic` ou `cam`, mais `codec` e `startKbps`
  na tela. Quem recebe responde com `answer()`, sem stream.
- **Troca de anfitrião:** quando o anfitrião sai, cada membro roda `electHost`. Vence o menor
  `joinedAt` (com o id para desempatar) e esse abre a porta e manda `room`. Sala vazia: quem chega
  recebe `peer-unavailable` duas vezes e vira anfitrião (`becomeHost('empty')`).
- **Mudar o protocolo:** aumente `PROTO`. Clientes antigos recebem `old` e são mandados recarregar.

## Regras de segurança (não quebrar)
- O código da sala só vai no `#` da URL e nas mensagens `knock`/`hello` (DTLS). Nunca no metadata do
  `peer.call` nem em ids do broker.
- Quem recebe uma conexão nunca manda o código antes de conferir o `hello` de quem ligou.
- Tudo que chega de outra pessoa é texto (`textContent`). Imagem só passa se bater em
  `IMG_RE` (webp/jpeg/png em base64).
- `kick` e `admit` só valem se vierem de `S.hostMain`. `room` só vale se quem manda se declara a si mesmo.

## Armadilhas já resolvidas (não repetir)
- O canal JSON do PeerJS recusa mensagens ≥16 300 bytes ("Message too big"). Por isso imagens vão em pedaços.
- Mover um `<video>` no DOM pausa o vídeo. `renderCams` só move quando a ordem muda, e chama `play()` depois.
- Uma nova chamada da mesma pessoa pode vir com o mesmo `stream.id`. Compare o objeto (`S.stageStream`).
- `<video>` com height 100% num grid cortava a imagem. O vídeo fica em `position:absolute; inset:0`.
- VP8 não aguenta 1440p60. Por isso o Fluidez usa H.264 High (hardware, conferido com `mediaCapabilities`).

## Testar
- **Servidor local:** crie `.claude/launch.json` na pasta de trabalho da sessão, com
  `python -m http.server 8765 --bind 127.0.0.1 --directory <esta pasta>`, e use `preview_start`.
  Apague o arquivo depois.
- **Abas:** abra várias e preencha `#name` + `lobby-form.requestSubmit()` por JavaScript.
- **Simulações:** troque `navigator.mediaDevices.getDisplayMedia`/`getUserMedia` por um canvas
  (`captureStream`) ou um oscilador. O painel escondido do navegador do app trava `requestAnimationFrame`
  e baixa os quadros por segundo, então não meça qps lá.
- **Forçar TURN:** `PEER_OPTS.config.iceTransportPolicy = 'relay'` antes de entrar.
- **Sintaxe:** `node -e` com `new Function(<conteúdo do <script>>)`.

## Publicar
- `git add` só nos arquivos alterados. Commit com `user.name=bwernerdev`, mensagem em pt-BR e a linha
  `Co-Authored-By`. Depois `git push`.
- O GitHub Pages atualiza em ~1 min. Confira com curl procurando um trecho novo. Navegadores com cache
  precisam de Ctrl+F5.
- Senhas e tokens no código: o envio é bloqueado pelo classificador. Peça autorização explícita ao usuário.
