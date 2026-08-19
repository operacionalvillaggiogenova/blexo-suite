# Blexo-Check — versão de manutenção

Aplicativo web instalável para criar relatórios fotográficos de campo em PDF.

## Melhorias desta versão

- Geração de PDF aguarda o carregamento do jsPDF antes de executar, evitando o problema de clicar em “Gerar e baixar PDF” enquanto a biblioteca ainda não terminou de carregar.
- Erros de geração agora são exibidos na própria tela, em vez de deixar o botão aparentemente sem resposta.
- O botão de PDF é reabilitado corretamente após sucesso ou erro.
- Service Worker atualizado para v6: os arquivos locais são pré-cacheados e recursos externos, como o jsPDF, passam a ser armazenados em cache durante o uso online.
- O modo offline continua usando IndexedDB para relatórios, fotos e observações.

## Dados e funcionamento offline

- Relatórios, fotos e observações são salvos somente no navegador do aparelho, via IndexedDB.
- Não há banco de dados, API ou envio de fotos para o servidor.
- Após abrir o app uma vez com internet e carregar o gerador de PDF, o uso pode continuar offline.

## Executar localmente

```powershell
node server.js
```

Abra `http://localhost:3000`.

## Publicação

Copie a pasta para a área pública da aplicação Node existente e sirva-a com HTTPS em produção.


## Sincronização Google/Gmail + Drive

A v24 adiciona autenticação com conta Google/Gmail e sincronização offline-first com `Meu Drive/Blexo Suite/check`. Veja `GOOGLE_SETUP.md` antes de publicar. O Client ID fica em `config.js`; não há client secret no navegador.
