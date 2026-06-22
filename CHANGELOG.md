# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [2.0.0] - 2026-06-22

### Removido
- Biblioteca TypeScript de processamento de pedidos (foco 100% no pipeline n8n + DevOps)

### Alterado
- Projeto reposicionado como pipeline ETL puro com n8n + Docker
- README e documentação simplificados, narrativa coesa
- CI/CD focado em validação do workflow n8n e docker-compose
- Dependabot sem npm (só Docker + Actions)

## [1.0.0] - 2026-06-22

### Adicionado
- Migração completa para TypeScript strict mode
- Strategy Pattern para cálculo de desconto
- Validação em runtime com Zod
- Logging estruturado com Pino
- CI/CD via GitHub Actions
- Healthcheck e limites de recursos no Docker
- ADRs documentando decisões de arquitetura
- 47 testes unitários com `node:test` nativo

### Alterado
- Projeto renomeado de `boavista-teste` para `flowgate-automation`
- Docker Compose com versão fixa, healthcheck e limites de log

## [0.1.0] - 2026-05-21

### Adicionado
- Implementação inicial: workflow n8n para sincronização de usuários
- Docker Compose com volumes persistentes e rede bridge
- Script `start.sh` e `.env.example`

[2.0.0]: https://github.com/lucasdaniel2201/flowgate-automation/releases/tag/v2.0.0
[1.0.0]: https://github.com/lucasdaniel2201/flowgate-automation/releases/tag/v1.0.0
[0.1.0]: https://github.com/lucasdaniel2201/flowgate-automation/releases/tag/v0.1.0
