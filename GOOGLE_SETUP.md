# Blexo Suite — sincronização Google/Gmail + Drive

Esta versão mantém o Blexo-Check **offline-first**. O IndexedDB do aparelho continua funcionando sem login. Quando o usuário conecta uma conta Google/Gmail, os relatórios são sincronizados com:

`Meu Drive / Blexo Suite / check`

## 1. Criar o Client ID

No Google Cloud Console, crie/seleciona um projeto e configure o OAuth consent screen. Depois crie uma credencial:

- APIs: Google Drive API
- Credential: OAuth Client ID
- Application type: Web application
- Authorized JavaScript origins: o endereço HTTPS onde o Blexo será publicado

Exemplo de origin:
`https://operacionalvillaggiogenova.github.io`

Não coloque segredo/client secret no código. Para aplicação web com Google Identity Services, somente o Client ID público fica no `config.js`.

## 2. Informar o Client ID

Edite `config.js`:

`clientId: 'SEU_CLIENT_ID.apps.googleusercontent.com'`

## 3. Como a sincronização funciona

- Sem internet: dados ficam no IndexedDB.
- Com internet + Google conectado: alterações locais são enviadas ao Drive.
- O Blexo cria a pasta `Blexo Suite` e a subpasta `check` automaticamente.
- Cada relatório é salvo como um JSON identificado pelo ID único.
- O relatório com `updatedAt` mais recente vence em um conflito simples.
- Relatórios existentes no Drive e ausentes no aparelho são baixados.
- Exclusões locais ficam em uma fila de exclusão e são refletidas no Drive na próxima sincronização.
- O token OAuth fica somente em memória; ele não é gravado no IndexedDB.

## 4. Permissão utilizada

O Blexo solicita `drive.file`. Isso limita o acesso aos arquivos/pastas criados ou utilizados pelo próprio aplicativo, em vez de pedir acesso indiscriminado ao Drive inteiro.

## Próxima etapa

A mesma camada `sync.js` deve ser generalizada para:

- `check`
- `leiturista`
- `scanner`
- `orcamentos`

Assim, o Blexo Suite terá uma única arquitetura de sincronização para todos os módulos.
