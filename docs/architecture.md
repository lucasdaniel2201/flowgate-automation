# Arquitetura de Referência

> Status: Draft
> Versão: 1.0

## Visão Geral (C4 - Nível 1 — Contexto)

```mermaid
graph TB
    Client[Cliente ou Cron Job] -->|POST /webhook/iniciar| Flowgate
    Flowgate[n8n: Flowgate Pipeline] -->|GET /users| ExtAPI[External API]
    Flowgate -->|POST /cadastrar| CRM[CRM/ERP Webhook]
    Flowgate -.- Metrics[Prometheus Metrics]
    Flowgate -.- Logs[JSON Logs → Loki/Datadog]

    subgraph Docker[Docker Host - flowgate_network]
        Flowgate
    end
```

## Fluxo do Pipeline (Nível 2 — Workflow)

```mermaid
sequenceDiagram
    participant Web as Webhook
    participant n8n as n8n Engine
    participant API as External API
    participant CRM as CRM Webhook

    Web->>n8n: POST /webhook/iniciar
    n8n->>API: GET /users
    API-->>n8n: [User1, User2, ...]

    loop Para cada usuário
        n8n->>n8n: Filter (.net/.org)
    end

    loop Para cada usuário (batched 1/2s)
        n8n->>n8n: Transform to CRM schema
        n8n-->>CRM: POST /cadastrar
        note over n8n,CRM: 5 retries | OnError: Continue
    end

    n8n-->>Web: { executionTime, totalItemsProcessed, correlationId }
```

## Decisões de Arquitetura

Ver `docs/decisions/` para os ADRs detalhados:

1. **Por que n8n e não Airflow/Temporal?** — Zero-dependências, low-code
   para MVP, mas migrável para Temporal quando > 100k execuções/dia.
2. **Por que batching client-side e não message queue?** — Simplicidade
   operacional. Sem dependência de Redis/RabbitMQ no MVP.
3. **Por que TypeScript e não JavaScript vanilla?** — Tipagem forte
   previne bugs de runtime e serve como documentação viva.

## Estrutura de Diretórios

```
flowgate-automation/
├── src/
│   ├── core/
│   │   ├── domain/          # Interfaces e tipos (Order, PricingRule, ProcessedOrder)
│   │   ├── services/        # Lógica de negócio (OrderProcessor, OrderValidator)
│   │   ├── errors/          # Hierarquia de erros do domínio
│   │   └── utils/           # Logger estruturado, helpers
│   ├── cli/                 # Entrypoint CLI
│   ├── __tests__/           # Testes unitários + fixtures
│   └── index.ts             # Barrel export
├── workflows/               # Workflow n8n (importável)
├── docs/                     # Documentação estendida
│   ├── architecture.md      # Este documento
│   ├── decisions/           # Architecture Decision Records
│   └── observability.md     # Guia de métricas e dashboards
├── .github/
│   ├── workflows/           # CI/CD pipelines
│   ├── ISSUE_TEMPLATE/      # Templates de issue
│   └── dependabot.yml       # Atualização de dependências
├── docker-compose.yml       # IaC principal
├── docker-compose.override.yml  # Overrides de desenvolvimento
├── Dockerfile               # Multi-stage build
├── Makefile                 # Atalhos do desenvolvedor
└── README.md                # Documentação principal
```

## Stack Tecnológica

| Camada            | Tecnologia                             | Justificativa                        |
| ----------------- | -------------------------------------- | ------------------------------------ |
| Orquestração      | n8n 1.94.1                             | Low-code com resiliência nativa      |
| Containerização   | Docker + Docker Compose                | Portabilidade e IaC                  |
| Linguagem         | TypeScript 5.x (strict mode)           | Tipo como documentação fôrça         |
| Validação runtime | Zod                                    | Defesa em profundidade além de TS    |
| Logging           | Pino                                   | JSON estruturado, redação de secrets |
| Testes            | Vitest + Testcontainers                | Cobertura > 90% com threshold        |
| Qualidade         | ESLint + Prettier + Husky + Commitlint | Code quality gate automático         |
| CI/CD             | GitHub Actions                         | Quality gate + build em ~30s         |
| Observabilidade   | Prometheus metrics endpoint            | `http://localhost:5678/metrics`      |
