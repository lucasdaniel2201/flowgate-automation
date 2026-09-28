# Política de Segurança

## Versões suportadas

Apenas a versão mais recente recebe correções.

| Versão | Suportada |
| ------ | --------- |
| 1.x | :white_check_mark: |

## Reportando uma vulnerabilidade

Não abra uma issue pública. Use o
[GitHub Security Advisories](https://github.com/lucasdaniel2201/flowgate-automation/security/advisories/new)
deste repositório — o relatório fica visível só para quem mantém o projeto.

Inclua passos para reproduzir, a versão afetada e o impacto. Você recebe uma
confirmação em até 48 horas e um retorno sobre a correção em até 5 dias úteis.

## O que este repositório faz para se proteger

- **Secrets no `.env`, fora do git.** O `.gitignore` exclui `.env` e `.env.*`;
  só o `.env.example` é versionado, e ele não contém credencial nenhuma.
- **Versão de imagem fixa.** `n8nio/n8n:1.123.82`, nunca `:latest` — uma
  atualização silenciosa quebra o pipeline sem aviso.
- **Rede isolada.** O n8n fica na bridge `flowgate_network`, não na rede padrão.
- **Limites de recurso.** CPU e memória limitados, então um workflow em loop não
  derruba o host.
- **Logs rotacionados.** `max-size: 10m` e `max-file: 3` impedem que o log encha
  o disco.
- **Dependabot.** Abre PR semanal para a imagem Docker e mensal para as Actions.

## O que este repositório **não** faz

Isto é importante o suficiente para ficar explícito, porque a configuração
padrão é de desenvolvimento:

- **Não há autenticação própria nem TLS.** O `N8N_BASIC_AUTH_*` foi removido do
  n8n muito antes da 1.0 e **não tem efeito nenhum** na 1.123.82 — a instância
  responde `200` sem credencial alguma. O controle de acesso é o *user
  management* do próprio n8n: na primeira visita ao editor ele pede para você
  criar a conta de dono da instância.
- **Não exponha a porta 5678 na internet.** Se precisar de acesso remoto, coloque
  um reverse proxy com HTTPS na frente e use a autenticação do n8n.
- **O webhook não é autenticado.** Qualquer um que alcance a porta pode disparar
  `POST /webhook/iniciar`. Há uma tarefa no
  [roadmap](docs/roadmap.md) para exigir um header secreto.
- **Sem criptografia de credenciais.** O `N8N_ENCRYPTION_KEY` está comentado no
  `.env.example`: sem ele, o n8n gera uma chave própria no volume. Em produção,
  defina a chave explicitamente para poder restaurar backup em outra máquina.
- **A versão da imagem é fixa, e o bump passa pelo smoke test.** A
  `n8nio/n8n:1.123.82` atende ao mínimo de segurança que o próprio n8n apontava
  (a instância pedia 1.121.0 ou superior). A versão continua fixa de propósito,
  para o pipeline ser previsível — nunca `:latest`. O Dependabot abre PR semanal
  para subir a imagem; ao aceitar o bump, confira as `typeVersion` dos nós
  (`tests/workflow.test.mjs` falha se elas passarem do que a imagem nova
  suporta) e deixe o smoke test ponta a ponta rodar antes de mesclar.

## Divulgação responsável

Seguimos as diretrizes do
[NCSC](https://www.ncsc.gov.uk/information/vulnerability-disclosure-toolkit).
