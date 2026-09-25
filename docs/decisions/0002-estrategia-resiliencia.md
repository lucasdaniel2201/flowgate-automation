# ADR-0002: Estratégia de resiliência (retries, batching e falhas parciais)

- **Status**: Aceito
- **Data**: 2026-06-22
- **Decisor**: Lucas Daniel

---

## Contexto

O nó de carga faz `POST` para um webhook de destino que:

- pode ter **rate limiting** (HTTP 429 quando as requisições se acumulam)
- pode falhar de forma **transitória** (timeout, 5xx)
- **não deve derrubar a execução inteira** quando um único registro falha

## Decisão

A resiliência é declarativa, em três camadas no `workflows/workflow_user_sync.json`.

### Camada 1 — Batching (proteção contra rate limit)

```json
"options": {
  "batching": { "batch": { "batchSize": 1, "batchInterval": 2000 } }
}
```

Um item por batch, 2s entre batches. O intervalo é a distância entre batches,
não um atraso antes de cada requisição.

**Por que 2s e não 1s?** Margem. O destino pode ser uma API de terceiro com
limite agressivo, e 2s absorve variação de latência sem transformar a carga em
gargalo.

### Camada 2 — Retry com espera fixa

```json
"retryOnFail": true,
"maxTries": 5,
"waitBetweenTries": 5000
```

Cinco tentativas, 5s entre elas: até ~25s por item antes de desistir.

**Por que 5 e não 3?** O destino pode estar em cold start ou em pico. Três
tentativas (~10s) desistem cedo demais para um serviço que leva alguns segundos
para voltar.

### Camada 3 — Tolerância a falhas parciais

```json
"onError": "continueRegularOutput"
```

Se um item falhar depois de todas as tentativas, ele vira **aviso** no
resultado e a execução segue para os próximos. O sumário final traz o total
processado, o que permite reconciliar o que ficou de fora.

## Comportamento medido

Nesta configuração (2 usuários, destino respondendo 201):

| Cenário | Tempo |
| ------- | ----- |
| Caminho feliz | ~2,7s (≈2s de batching + latência das requisições) |
| Destino fora do ar, por item | ~25s (5 tentativas × 5s) |

O segundo número é o custo real da tolerância a falhas: um destino quebrado não
interrompe o pipeline, mas cada item leva ~25s para ser marcado como falho.

## Alternativas consideradas

| Alternativa | Rejeitada porque |
| ----------- | ---------------- |
| **Backoff exponencial** | O nó HTTP do n8n não tem backoff exponencial nativo; exigiria Code node com fila própria |
| **DLQ (Redis/RabbitMQ)** | Introduz uma dependência de infraestrutura para um volume que não a justifica |
| **Processar tudo ou nada** | Contraria o requisito: um registro ruim não pode bloquear os outros |
| **Retry só no final, em lote** | Duplicaria a lógica e complicaria a reconciliação |

## Consequências

**Positivas:** pipeline tolerante a falha de item, sem dependência extra, com
configuração visível no próprio workflow.

**Negativas:** não há retry automático do que falhou. Se 50% dos registros
caírem, é preciso rodar de novo — e, sem idempotência no destino, isso pode
duplicar o que já tinha sido gravado.

## Evolução natural

1. Dead Letter Queue para os itens que esgotaram as tentativas
2. Reprocessamento só da DLQ, sem tocar no que já foi gravado
3. Se o destino tiver chave natural, tornar o `POST` idempotente do lado dele
