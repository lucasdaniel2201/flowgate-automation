# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Alterado

- Atualiza a imagem do n8n de 1.94.1 para 1.123.82, que está dentro da baseline de
  segurança que o próprio n8n aponta como mínima. O bump passou pelos 23 testes
  estáticos e pelo smoke test ponta a ponta no CI.
- Alinha à nova versão a documentação que citava a 1.94.1: README, SECURITY.md,
  `docs/architecture.md`, `docs/observability.md`, `docs/roadmap.md`, o template
  de issue e o comentário do `tests/workflow.test.mjs`.

## [1.0.0] - 2026-09-25

### Adicionado
- Pipeline n8n de 6 nós: webhook de entrada, extração de usuários, filtro por
  domínio de e-mail, transformação para o schema de destino e carga com retry,
  batching (1 requisição a cada 2s) e tolerância a falhas parciais
- Docker Compose com versão de imagem fixa, healthcheck, limites de CPU e
  memória, rede bridge isolada, volume nomeado e rotação de logs
- Suíte de 23 testes estáticos (`tests/`, `node:test`), sem rede e sem containers
- Smoke test ponta a ponta (`scripts/smoke-test.sh`) e CI rodando os dois
- `scripts/import-workflow.sh`: importação idempotente do workflow por CLI, com
  ativação e espera do webhook registrar
- `Makefile` e `start.sh` como atalhos de operação
- Métricas Prometheus e logs JSON, documentados em `docs/observability.md`
- ADRs das decisões de arquitetura em `docs/decisions/`
- Dependabot monitorando a imagem Docker e as GitHub Actions

[Unreleased]: https://github.com/lucasdaniel2201/flowgate-automation/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/lucasdaniel2201/flowgate-automation/releases/tag/v1.0.0
