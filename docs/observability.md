# Observability Guide

> Flowgate Automation expõe métricas e logs estruturados para integração
> com seu stack de monitoramento.

---

## Métricas (Prometheus)

O n8n expõe métricas no endpoint `/metrics` quando configurado com
`N8N_METRICS=true` (padrão).

### Endpoint

```
GET http://localhost:5678/metrics
```

### Métricas disponíveis

| Métrica                                   | Tipo      | Descrição                            |
| ----------------------------------------- | --------- | ------------------------------------ |
| `n8n_workflow_executions_total`           | Counter   | Total de execuções (sucesso + falha) |
| `n8n_workflow_executions_succeeded_total` | Counter   | Execuções concluídas com sucesso     |
| `n8n_workflow_executions_failed_total`    | Counter   | Execuções que falharam               |
| `n8n_node_operations_total`               | Counter   | Operações por nó                     |
| `n8n_http_request_duration_seconds`       | Histogram | Latência de chamadas HTTP            |
| `n8n_active_workflows`                    | Gauge     | Número de workflows ativos           |

### Scrape Config (Prometheus)

```yaml
scrape_configs:
  - job_name: 'flowgate-n8n'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:5678']
    metrics_path: '/metrics'
    basic_auth:
      username: '${N8N_BASIC_AUTH_USER}'
      password: '${N8N_BASIC_AUTH_PASSWORD}'
```

### Exemplo de Dashboard Grafana

Crie um painel com os seguintes painéis:

1. **Workflow Execution Rate** — `rate(n8n_workflow_executions_total[5m])`
2. **Success Rate** — `n8n_workflow_executions_succeeded_total / n8n_workflow_executions_total`
3. **P99 HTTP Latency** — `histogram_quantile(0.99, n8n_http_request_duration_seconds)`
4. **Active Workflows** — `n8n_active_workflows`

---

## Logs Estruturados (JSON)

A biblioteca TypeScript usa **Pino** para emitir logs JSON estruturados.

### Formato

```json
{
  "level": 30,
  "time": "2026-06-22T14:30:00.000Z",
  "pid": 1234,
  "hostname": "flowgate-worker-1",
  "service": "flowgate-automation",
  "module": "OrderProcessor",
  "msg": "Processing complete",
  "grandTotal": 672,
  "count": 3,
  "average": 224,
  "durationMs": 2
}
```

### Níveis

| Level | Constante       | Uso                                        |
| ----- | --------------- | ------------------------------------------ |
| 10    | `trace`         | Debug detalhado de cada iteração           |
| 20    | `debug`         | Valores intermediários, desvios            |
| 30    | `info` (padrão) | Eventos de negócio (início, fim, métricas) |
| 40    | `warn`          | Degradação, fallback ativado               |
| 50    | `error`         | Exceções, validação falhou                 |

### Redação de Secrets

Campos sensíveis são automaticamente ofuscados:

- `password` → `[REDACTED]`
- `token` → `[REDACTED]`
- `secret` → `[REDACTED]`
- `authorization` → `[REDACTED]`

### Integração (Loki + Grafana)

Envie logs para Loki via Docker logging driver:

```yaml
# docker-compose.yml
services:
  n8n:
    logging:
      driver: loki
      options:
        loki-url: 'http://loki:3100/loki/api/v1/push'
        loki-external-labels: 'service=flowgate-n8n'
```

---

## SLIs (Service Level Indicators)

| SLI                 | Definição                                | SLO Sugerido |
| ------------------- | ---------------------------------------- | ------------ |
| **Disponibilidade** | % de execuções que chegam ao nó final    | ≥ 99.5%      |
| **Latência**        | P99 do tempo total da execução           | ≤ 30s        |
| **Taxa de Erro**    | % de execuções com falha em qualquer nó  | ≤ 1%         |
| **Frescor**         | Atraso desde o último webhook até o POST | ≤ 5min       |

---

## Alertas Recomendados

```yaml
# AlertManager rules
groups:
  - name: flowgate
    rules:
      - alert: HighErrorRate
        expr: rate(n8n_workflow_executions_failed_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: 'Flowgate: error rate > 5% in the last 5 minutes'

      - alert: WorkflowNotRunning
        expr: n8n_active_workflows == 0
        for: 10m
        annotations:
          summary: 'Flowgate: no active workflows detected'
```
