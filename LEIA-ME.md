# Tela Compartilhada

Página única (`index.html`) para compartilhar a tela por link, no estilo do Google Meet.
Não precisa de conta nem de instalar nada.

## Como usar

1. Abra a página, digite seu nome e clique em **Criar sala**.
2. Copie o link que aparece (ou use **Copiar link** no topo) e mande para quem vai assistir.
3. Clique em **Apresentar** e escolha a tela, a janela ou a aba. Para enviar o som do PC,
   marque “Compartilhar áudio” na janela do navegador.
4. Quem abre o link digita o nome, clica em **Entrar** e vê a tela ao vivo.
   Para pôr em **tela cheia**, use o botão no canto do vídeo, o botão da barra ou dê dois cliques no vídeo.
5. Opcional: o botão do **microfone** liga a sua voz para todos, e o **chat** fica no painel lateral.
6. **Sair** (botão vermelho) encerra a sua participação.

### Qualidade da imagem

O botão **HD**, ao lado de Apresentar, escolhe a qualidade de quando você apresenta.
Dá para trocar no meio da apresentação:

- **Nitidez** (padrão): para texto, código e planilhas. Captura até 1440p a 30 quadros/s, com até 6 Mbps.
  Se a rede apertar, perde quadros, mas mantém a resolução.
- **Fluidez**: para jogos e vídeos. 1080p a até 60 quadros/s, com até 8 Mbps.
  Se a rede apertar, perde resolução, mas mantém o movimento.

O som do PC vai em estéreo a 128 kbps, sem os filtros de voz. Quem assiste vê no canto do vídeo a resolução
que está chegando (ex.: `1920×1080`). Se esse número cair, a internet de alguém está segurando a qualidade.

Qualquer pessoa da sala pode apresentar. Quando alguém começa, quem estava apresentando para.

## Requisitos

- Para apresentar: Chrome, Edge ou Firefox de computador.
- Para assistir: qualquer navegador moderno, inclusive no celular.
- A página precisa estar num endereço **https** (ou `localhost`), porque o navegador só deixa capturar a tela em sites seguros.

## Como funciona

- **Sinalização:** para dois navegadores se acharem, eles trocam ofertas e respostas WebRTC por meio do
  servidor público e gratuito do [PeerJS](https://peerjs.com) (`0.peerjs.com`). Esse servidor só repassa
  essas mensagens. Ele recebe um *hash* do código da sala, nunca o código em si.
- **Imagem, som e chat:** vão direto de um navegador para o outro, por WebRTC, criptografados (DTLS/SRTP).
  Cada pessoa se liga a cada outra pessoa (malha), o que funciona bem até umas 5 ou 6 pessoas.
- **Quem entra:** o código da sala (24 caracteres aleatórios, cerca de 120 bits) fica depois do `#` no link.
  Essa parte do endereço nunca é enviada a nenhum servidor. Toda conexão precisa mostrar o código antes de
  receber qualquer coisa da sala (nome, lista de pessoas, chat ou vídeo). Sem o código, a conexão é fechada.
- **Nada fica salvo:** o chat e a lista de pessoas só existem nas abas abertas e somem quando todos saem.
  Só o seu nome fica guardado no seu navegador, para não precisar digitar de novo.

## Limitações

- A sala depende da aba de quem a criou. Se essa aba fechar, quem já está continua conectado,
  mas ninguém novo entra até ela voltar (reabrindo o mesmo link na mesma aba).
- Sem servidor TURN (retransmissão), algumas redes bloqueiam a conexão direta: empresa, faculdade,
  4G/5G e provedores com CGNAT. Nesses casos, quem entra vê “A rede de vocês bloqueou a conexão direta”,
  e a página tenta de novo sozinha a cada ~25 s. Para funcionar em qualquer rede, use o TURN da Cloudflare
  (veja abaixo).

## TURN da Cloudflare (para funcionar em qualquer rede)

A pasta `cloudflare-turn/` tem um Worker que entrega à página credenciais TURN que expiram em 24 h.
A chave de verdade fica guardada como segredo na Cloudflare e nunca aparece no site.
O plano grátis cobre 1000 GB por mês, e o TURN só é usado quando a conexão direta falha.

1. Crie uma conta em [dash.cloudflare.com](https://dash.cloudflare.com).
2. No painel, abra **Realtime > TURN Server > Create**. Anote o **Turn Token ID** e o **API Token**.
3. Rode o script e siga as instruções. Ele faz o login, publica o Worker e pede os dois valores:

   ```bash
   powershell -ExecutionPolicy Bypass -File cloudflare-turn/configurar.ps1
   ```

4. Coloque o endereço `https://tela-compartilhada-turn.<sua-conta>.workers.dev` em `TURN_ENDPOINT`,
   no começo do script do `index.html`, e publique.
- O aviso do Chrome “… está compartilhando sua tela” não pode ser escondido pela página. É uma proteção do
  navegador. Clique em **Ocultar** para tirá-lo da frente.

## Testar no próprio PC

```bash
python -m http.server 8765 --bind 127.0.0.1 --directory .
```

Abra `http://localhost:8765` em uma aba, crie a sala e abra o link em outra aba.

Para usar entre PCs diferentes, publique o `index.html` num endereço https (por exemplo GitHub Pages,
Netlify ou Cloudflare Pages). É um arquivo só, sem build.
