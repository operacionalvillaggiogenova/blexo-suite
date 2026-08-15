# Blexo-Check

Aplicativo web instalável para coleta de leituras de gás e água, com evidências fotográficas e relatório PDF.

## Dados e funcionamento offline

- Relatórios, leituras, fotos e observações são salvos somente no navegador do aparelho, via IndexedDB.
- Não há banco de dados, API ou envio de fotos para o servidor. Cada relatório possui 26 blocos e 2 áreas comuns, com campos de leitura GAS e ÁGUA.
- Após abrir o app uma vez com internet, os arquivos do aplicativo e o gerador de PDF ficam em cache e o uso segue offline.
- Não limpe os dados do navegador e não desinstale o aplicativo se quiser preservar os relatórios locais. Os dados não são compartilhados entre aparelhos.

## Executar localmente

```powershell
python -m http.server 8000
```

Abra `http://localhost:8000`.

## Publicação

Pode ser publicada diretamente em GitHub Pages, Cloudflare Pages ou outro host estático. Use HTTPS em produção: navegadores de celular somente liberam a câmera em um contexto seguro.
