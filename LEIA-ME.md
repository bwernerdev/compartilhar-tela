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
   No chat dá para mandar **imagens**: pelo botão de imagem, colando com **Ctrl+V** (ex.: um print) ou
   arrastando o arquivo para o chat. A imagem é reduzida para no máximo 1920 px antes de ir, e um clique
   nela amplia e permite salvar. GIFs animados chegam parados.
6. Opcional: o botão da **câmera** liga a sua webcam. Com alguém apresentando, as câmeras aparecem numa
   faixa embaixo da tela. Sem apresentação, elas ocupam o centro em grade. Desligar a câmera desliga
   a webcam de verdade, e a luz dela apaga.
7. **Sair** (botão vermelho) encerra a sua participação.

### Qualidade da imagem

O botão **HD**, ao lado de Apresentar, escolhe a qualidade de quando você apresenta.
Dá para trocar no meio da apresentação:

- **Nitidez** (padrão): para texto, código e planilhas. Captura até 1440p a 30 quadros/s, com até 6 Mbps.
  Se a rede apertar, perde quadros, mas mantém a resolução.
- **Fluidez**: para jogos e vídeos. Até 1440p a 60 quadros/s, com até 16 Mbps. Usa H.264, que é codificado
  pela placa de vídeo (NVIDIA, Intel ou AMD), então não pesa na CPU nem atrapalha o jogo. Já começa
  com bitrate mais alto, para a imagem não ficar borrada nos primeiros segundos.
  Se a rede apertar, perde resolução, mas mantém o movimento.
  Trocar para ou de Fluidez no meio da apresentação reconecta a imagem: ela pisca por um instante.

Para 1440p60 chegar inteiro, quem apresenta precisa de uns 15 Mbps de upload por pessoa assistindo.
Com menos que isso, a resolução baixa sozinha para manter os 60 quadros/s.

O som do PC vai em estéreo a 128 kbps, sem os filtros de voz. Quem assiste vê no canto do vídeo a resolução
que está chegando (ex.: `1920×1080`). Se esse número cair, a internet de alguém está segurando a qualidade.

Qualquer pessoa da sala pode apresentar. Quando alguém começa, quem estava apresentando para.

### Anfitrião e sala de espera

- Quem cria a sala é o **anfitrião**. Quem abre o link fica numa tela de espera ("Pedindo para entrar…"),
  e o anfitrião vê um aviso com **Aceitar** e **Recusar**.
- Na aba **Pessoas**, o anfitrião pode desligar **Aprovar quem entra**. Aí qualquer um com o link entra direto.
- O anfitrião pode **remover** alguém pelo botão ao lado do nome.
- Se o anfitrião sair, quem entrou primeiro entre os que ficaram vira o anfitrião sozinho, e a sala
  continua aceitando gente. Se todos saírem, quem abrir o link de novo reabre a sala como anfitrião.

### Durante a chamada

- **Quem está falando:** o avatar (e o quadrinho da câmera) fica com borda verde.
- **Volume:** cada pessoa com microfone ligado tem um controle de volume na aba Pessoas. O som da tela
  compartilhada tem o seu, no canto do vídeo.
- **Janela flutuante:** o botão no canto do vídeo solta a tela compartilhada numa janelinha por cima de
  tudo, para assistir enquanto faz outra coisa.
- **Conexão:** embaixo do nome de cada pessoa aparece se a conexão é direta ou "Via TURN", o atraso em ms
  e a resolução que está chegando. A bolinha fica verde (boa), amarela (razoável) ou vermelha (ruim).

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
- **Porta da sala:** cada pessoa tem um endereço aleatório próprio. A sala tem uma "porta", um endereço
  derivado do código, aberta por quem é o anfitrião. Quem chega bate na porta, é aceito e só então recebe
  os endereços de quem está dentro. Os outros só aceitam a conexão de quem o anfitrião avisou que admitiu.
- **Nada fica salvo:** o chat e a lista de pessoas só existem nas abas abertas e somem quando todos saem.
  Só o seu nome fica guardado no seu navegador, para não precisar digitar de novo.

## Limitações

- Se a aba do anfitrião travar ou cair sem fechar direito, os outros podem levar até ~30 s para perceber
  e escolher o novo anfitrião. Fechando a aba ou clicando em Sair, a troca leva cerca de 1 s.
- Quem estiver com a página antiga aberta (antes da sala de espera) precisa recarregar com Ctrl+F5.
- Sem servidor TURN (retransmissão), algumas redes bloqueiam a conexão direta: empresa, faculdade,
  4G/5G e provedores com CGNAT. Nesses casos, quem entra vê “A rede de vocês bloqueou a conexão direta”,
  e a página tenta de novo sozinha a cada ~25 s. Para funcionar em qualquer rede, configure o TURN (veja abaixo).
- O aviso do Chrome “… está compartilhando sua tela” não pode ser escondido pela página. É uma proteção do
  navegador. Clique em **Ocultar** para tirá-lo da frente.

## App para apresentar sem o aviso do Chrome

A pasta [`app`](app/LEIA-ME.md) tem um app de Windows (`app\dist\Tela Compartilhada.exe`, portátil) para quem
**apresenta**. Ele abre esta mesma página, mas captura a tela por conta própria, com um seletor de tela/janela em
português e o som do PC. Assim a barra “… está compartilhando sua tela” não aparece. Quem assiste continua usando
só o link no navegador. Instruções em [`app/LEIA-ME.md`](app/LEIA-ME.md).

## TURN (para funcionar em qualquer rede)

A página usa o [ExpressTURN](https://www.expressturn.com). O plano grátis cobre 1000 GB por mês e tem servidor em São Paulo.
O TURN só é usado quando a conexão direta falha.

1. Crie uma conta grátis no ExpressTURN.
2. No painel, copie o endereço do servidor, o usuário e a senha.
3. Preencha a lista `TURN` no começo do script do `index.html` e publique.

O usuário e a senha ficam visíveis no código da página. Se alguém abusar, troque a senha no painel do
ExpressTURN e atualize a página.

## Testar no próprio PC

```bash
python -m http.server 8765 --bind 127.0.0.1 --directory .
```

Abra `http://localhost:8765` em uma aba, crie a sala e abra o link em outra aba.

Para usar entre PCs diferentes, publique o `index.html` num endereço https (por exemplo GitHub Pages,
Netlify ou Cloudflare Pages). É um arquivo só, sem build.
