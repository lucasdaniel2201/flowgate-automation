# ADR-0002: Estratégia de Resiliência (Retries + Batching + Failures)

- **Status**: Aceito
- **Data**: 2026-06-22
- **Decisor**: Lucas Daniel (autor)

---

## Contexto

O pipeline faz POST para um webhook CRM que:

- Tem **rate limiting** (HTTP 429 após muitas requisições simultâneas)
- Pode ter **falhas transitórias** (timeouts, 5xx)
- **Não deve falhar completamente** se apenas 1 registro falhar

## Decisão

Implementamos uma estratégia em **3 camadas**:

### Camada 1: Batching (Rate Limit Protection)

```json
{
  "batchSize": 1,
  "batchInterval": 2000
}
```

- 1 requisição a cada 2 segundos
- **Por que 2s e não 1s?**: Margem de segurança. APIs gratuitas
  (como jsonplaceholder) têm rate limits agressivos. 2s garante
  folga mesmo com latência de rede variável.

### Camada 2: Retry com Backoff

```json
{
  "retryOnFail": true,
  "maxTries": 5,
  "waitBetweenTries": 5000
}
```

- 5 tentativas com 5s entre cada uma
- **Por que 5 e não 3?**: O endpoint de destino pode ter cold starts
  ou picos. 5 tentativas (≈25s total) é tempo suficiente para
  recuperação sem ser excessivo.

### Camada 3: Tolerância a Falhas Parciais

```json
{
  "onError": "continueRegularOutput"
}
```

- Se um registro falhar (ex: HTTP 404), o pipeline **continua**
  para os próximos, em vez de abortar tudo.
- O sumário final reflete o total processado, permitindo
  reconciliação manual dos itens que falharam.

## Alternativas Consideradas

| Alternativa                      | Rejeitada porque...                             |
| -------------------------------- | ----------------------------------------------- |
| **Circular Buffer/Backpressure** | Overkill para < 500 registros                   |
| **DLQ (Dead Letter Queue)**      | Introduz dependência externa (Redis/RabbitMQ)   |
| **Exponential backoff**          | n8n não suporta nativamente backoff exponencial |
| **Processar tudo ou nada**       | Violaria o requisito de resiliência             |

## Consequências

- **Positivas**: Pipeline tolerante a falhas, sem dependências extras.
- **Negativas**: Se 50% dos registros falharem, não há retry automático
  para esses registros. Seria necessário um segundo pipeline para
  reconciliação.

## Evolução Natural

Para um sistema verdadeiramente robusto:

1. Migrar para **Temporal** com **Workflow + Activity + RetryPolicy**
2. Adicionar **DLQ** (SQS/Redis) para registros que falharam
3. Pipeline separado para reconciliação
