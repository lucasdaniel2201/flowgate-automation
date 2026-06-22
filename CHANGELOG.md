# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2026-06-22

### Adicionado

- Migração completa para TypeScript strict mode
- Strategy Pattern para cálculo de desconto (PricingRule)
- Validação em runtime com Zod nos schemas de entrada
- Logging estruturado com Pino
- Pipeline CI/CD via GitHub Actions (lint → typecheck → test → build)
- Healthcheck e limites de recursos nos serviços Docker
- ADRs documentando decisões-chave de arquitetura (0001: n8n, 0002: resiliência)
- Makefile com atalhos para o desenvolvedor
- README profissional com badges, diagrama Mermaid e início rápido em 3 comandos
- 47 testes unitários com `node:test` nativo (zero dependências de bundler)
- Build com esbuild (ESM + CJS + declarações de tipo)
- Husky + lint-staged + commitlint para qualidade de commit
- .env.schema.json validando estrutura do .env
- Dependabot configurado (npm + Docker + GitHub Actions)

### Alterado

- Projeto renomeado de `boavista-teste` para `flowgate-automation`
- Docker Compose atualizado com versão fixa da imagem, healthcheck e limites de log
- `processOrders` refatorado de JS vanilla para módulos TypeScript (SRP aplicado)
- Testes migrados de Vitest para `node:test` nativo (compatibilidade Windows)
- Build migrado de tsup para esbuild (evita binários nativos do Rollup)

### Segurança

- Versão da imagem Docker n8n fixada (1.94.1) substituindo `:latest`
- Adicionado `.dockerignore` para prevenir vazamento de credenciais
- Endpoints sensíveis agora configurados via variáveis `.env`
- Container executa como usuário non-root (UID 1001)

## [0.1.0] - 2026-05-21

### Adicionado

- Implementação inicial: workflow n8n para sincronização de usuários
- Infraestrutura Docker Compose com volumes persistentes e rede bridge
- Função JavaScript `processOrders` com relatório de correção de bugs
- `.env.example` básico e script `start.sh`

[1.0.0]: https://github.com/lucasdaniel2201/flowgate-automation/releases/tag/v1.0.0
[0.1.0]: https://github.com/lucasdaniel2201/flowgate-automation/releases/tag/v0.1.0
