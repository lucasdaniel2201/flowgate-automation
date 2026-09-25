# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

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
