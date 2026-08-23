# Blexo-Suite

Correções do scanner:
- A4 como formato padrão.
- Orientação automática por página: retrato ou paisagem.
- Confirmação manual da orientação com botões ↕ Retrato / ↔ Paisagem junto à miniatura.
- Ao trocar manualmente a orientação, a página é girada 90° para manter o conteúdo coerente com a orientação escolhida.
- Miniatura respeita a orientação selecionada.
- Geração do PDF detecta a proporção real da imagem salva para corrigir páginas antigas que tenham orientação registrada incorretamente.
- PDF A4 respeita a orientação de cada página e encaixa a imagem proporcionalmente no espaço disponível, sem deformar.
- Compatibilidade do scanner preservada para web, iOS e Android.


## v37
- Corrigido acesso aos resultados do IndexedDB no módulo Rateios, eliminando o erro `intermediate value).sort is not a function` ao salvar/gerar PDF.
- Blocos e apartamentos agora são ordenados automaticamente por ordem natural a cada inclusão e ao abrir rascunhos.
- O PDF usa a mesma ordem automática da tela.
- Se o jsPDF falhar, o módulo tenta automaticamente o gerador local/offline.
