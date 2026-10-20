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
- Não há servidor TURN (retransmissão). Em algumas redes muito fechadas (empresa, faculdade, alguns 4G/5G
  com CGNAT) a conexão direta falha e a página fica em “Ainda tentando conectar…”. Nesses casos, tente outra
  rede. Para funcionar em qualquer rede, seria preciso adicionar um TURN (pago ou próprio) na lista `ICE`
  no começo do script.

## Testar no próprio PC

```bash
python -m http.server 8765 --bind 127.0.0.1 --directory .
```

Abra `http://localhost:8765` em uma aba, crie a sala e abra o link em outra aba.

Para usar entre PCs diferentes, publique o `index.html` num endereço https (por exemplo GitHub Pages,
Netlify ou Cloudflare Pages). É um arquivo só, sem build.
