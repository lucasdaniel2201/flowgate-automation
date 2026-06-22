# ADR-0001: Por que n8n e não Airflow/Temporal?

- **Status**: Aceito
- **Data**: 2026-06-22
- **Decisor**: Lucas Daniel (autor)

---

## Contexto

O projeto precisa orquestrar um pipeline ETL:

1. GET em API externa
2. Filtrar registros por domínio de email
3. Transformar para schema de destino
4. POST em webhook CRM com retry e batching

As opções consideradas foram:

| Ferramenta   | Complexidade | Curva | Dependências             | Ideal para                          |
| ------------ | ------------ | ----- | ------------------------ | ----------------------------------- |
| **n8n**      | Baixa        | 1 dia | Docker                   | < 10k execuções/dia                 |
| **Airflow**  | Alta         | 1 sem | Postgres, Redis, Workers | > 100k execuções/dia                |
| **Temporal** | Muito Alta   | 2 sem | Server, DB, SDK          | Workflows complexos com compensação |

## Decisão

**Escolhemos n8n** pelos seguintes motivos:

1. **Zero dependências externas**: O n8n roda em um único container Docker.
   Airflow precisaria de Postgres + Redis + Scheduler + Workers.
2. **Curva de aprendizado**: O workflow é configurável via drag-and-drop e
   código JavaScript inline. Ideal para MVP.
3. **Resiliência built-in**: Retry on fail, onError continue e batching
   são nativos — sem código extra.
4. **Portabilidade**: O workflow é um JSON que pode ser versionado.
5. **Alinhamento com o escopo**: O teste original exigia n8n.

## Consequências

- **Positivas**: Deploy simplificado, manutenção zero, versionável.
- **Negativas**: Para volumes > 100k req/dia ou workflows com compensação
  (Saga Pattern), n8n não é ideal.

## Migração Futura

Se o volume ultrapassar 100k execuções/dia, a migração natural é:

1. Extrair a lógica TypeScript para uma lib independente (já feito ✅)
2. Empacotar como atividade no **Temporal** (Go/TypeScript SDK)
3. Manter o n8n como trigger HTTP → enfileirar no Temporal

O código TypeScript foi estruturado com Strategy Pattern e IoC para
facilitar essa migração — basta trocar o invocador.
