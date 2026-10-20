# Publica o Worker de TURN na sua conta da Cloudflare.
# Antes, crie a chave TURN no painel: dash.cloudflare.com > Realtime > TURN Server > Create.
# Guarde o "Turn Token ID" e o "API Token" que aparecem; o script vai pedir os dois.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$W = 'wrangler@4.145.0'

function Step($n, $msg) { Write-Host "`n[$n/4] $msg" -ForegroundColor Cyan }

Step 1 'Entrando na Cloudflare (pode abrir o navegador para você autorizar)...'
$who = (& npx.cmd --yes $W whoami 2>&1) -join "`n"
if ($who -match 'not authenticated|You are not') {
  & npx.cmd --yes $W login
  if ($LASTEXITCODE -ne 0) { throw 'O login na Cloudflare não foi concluído.' }
}

Step 2 'Publicando o Worker...'
& npx.cmd --yes $W deploy
if ($LASTEXITCODE -ne 0) { throw 'A publicação do Worker falhou.' }

Step 3 'Cole o "Turn Token ID" e tecle Enter (não aparece na tela):'
& npx.cmd --yes $W secret put TURN_KEY_ID
if ($LASTEXITCODE -ne 0) { throw 'Não deu para salvar o TURN_KEY_ID.' }
Write-Host 'Agora cole o "API Token" do TURN e tecle Enter (não aparece na tela):' -ForegroundColor Cyan
& npx.cmd --yes $W secret put TURN_KEY_API_TOKEN
if ($LASTEXITCODE -ne 0) { throw 'Não deu para salvar o TURN_KEY_API_TOKEN.' }

Step 4 'Pronto. Copie o endereço https://...workers.dev mostrado no passo 2 e mande para o Claude.'
