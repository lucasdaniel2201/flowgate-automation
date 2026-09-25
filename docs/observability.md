# Observabilidade

O que o n8n 1.94.1 realmente expõe, e o que ele **não** expõe.

## Métricas (Prometheus)

Habilitadas por `N8N_METRICS=true` (o padrão do `docker-compose.yml`).

```
GET http://localhost:5678/metrics
```

Todas as métricas saem no formato de texto do Prometheus e vêm prefixadas com
`n8n_`. O que existe de fato:

| Métrica | Tipo | Descrição |
| ------- | ---- | --------- |
| `n8n_active_workflow_count` | Gauge | Quantos workflows estão ativos |
| `n8n_version_info` | Gauge | Versão do n8n, com labels `version`, `major`, `minor`, `patch` |
| `n8n_process_cpu_seconds_total` | Counter | CPU do processo |
| `n8n_process_resident_memory_bytes` | Gauge | Memória residente |
| `n8n_process_open_fds` | Gauge | Descritores de arquivo abertos |
| `n8n_nodejs_heap_size_used_bytes` | Gauge | Heap do Node em uso |
| `n8n_nodejs_eventloop_lag_p99_seconds` | Gauge | Lag do event loop (p99) |
| `n8n_nodejs_gc_duration_seconds` | Histogram | Duração das coletas de lixo |

O restante é o conjunto padrão do `prom-client` do Node (`n8n_process_*`,
`n8n_nodejs_*`), útil para saber se o container está saudável e se a memória
está crescendo.

> **O que não existe:** o n8n Community não publica contadores por execução ou
> por nó nesta versão. Não há `n8n_workflow_executions_total`,
> `n8n_workflow_executions_failed_total`, latência por requisição HTTP nem
> métricas por workflow. Para acompanhar execuções, o caminho é a lista de
> execuções no editor ou a tabela `execution_entity` do banco.

### Scrape config (Prometheus)

```yaml
scrape_configs:
  - job_name: 'flowgate-n8n'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:5678']
    metrics_path: '/metrics'
```

### Consultas úteis

```promql
# O workflow está ativo?
n8n_active_workflow_count

# Quanta memória o n8n está usando
n8n_process_resident_memory_bytes / 1024 / 1024

# O event loop está travando?
n8n_nodejs_eventloop_lag_p99_seconds
```

### Alertas

Um alarme que faz sentido com o que é exposto é o workflow cair:

```yaml
groups:
  - name: flowgate
    rules:
      - alert: FlowgateSemWorkflowAtivo
        expr: n8n_active_workflow_count == 0
        for: 10m
        annotations:
          summary: 'Flowgate: nenhum workflow ativo há 10 minutos'

      - alert: FlowgateMemoriaAlta
        expr: n8n_process_resident_memory_bytes > 800 * 1024 * 1024
        for: 15m
        annotations:
          summary: 'Flowgate: n8n usando mais de 800 MB'
```

## Logs

O nível é controlado por `N8N_LOG_LEVEL` (`info` no compose base, `debug` no
override de desenvolvimento). O log é JSON estruturado por linha:

```json
{
  "level": "info",
  "ts": 1790350396225,
  "msg": "Workflow execution finished successfully",
  "scopes": ["workflow-execution"],
  "workflowId": "flowgate-user-sync",
  "file": "LoggerProxy.js",
  "function": "exports.debug"
}
```

O `docker-compose.yml` já limita o tamanho dos logs (`max-size: 10m`,
`max-file: 3`), então um pipeline em loop não enche o disco.

Enviar para o Loki:

```yaml
services:
  n8n:
    logging:
      driver: loki
      options:
        loki-url: 'http://loki:3100/loki/api/v1/push'
        loki-external-labels: 'service=flowgate-n8n'
```

## Rastreabilidade por execução

Cada execução devolve um `correlationId` no sumário do webhook — é o próprio id
da execução no n8n. Com ele dá para achar a execução exata no editor e conferir
nó por nó o que aconteceu:

```bash
curl -X POST http://localhost:5678/webhook/iniciar
# {"executionTime":"...","message":"...","totalItemsProcessed":2,"correlationId":"4"}
```

O n8n mantém o histórico no volume `flowgate_n8n_data`, e o
`EXECUTIONS_DATA_PRUNE=true` com `EXECUTIONS_DATA_MAX_AGE=168` descarta o que
tem mais de 7 dias.
