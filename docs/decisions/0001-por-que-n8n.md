# ADR-0001: Por que n8n e não Airflow ou Temporal?

- **Status**: Aceito
- **Data**: 2026-06-22
- **Decisor**: Lucas Daniel

---

## Contexto

O projeto precisa orquestrar um pipeline ETL:

1. `GET` em uma API externa
2. Filtrar registros por domínio de e-mail
3. Transformar para o schema de destino
4. `POST` em um webhook, com retry e batching

As opções consideradas:

| Ferramenta | Complexidade | Curva de aprendizado | Dependências | Ideal para |
| ---------- | ------------ | -------------------- | ------------ | ---------- |
| **n8n** | Baixa | ~1 dia | Docker | < 10k execuções/dia |
| **Airflow** | Alta | ~1 semana | Postgres, Redis, Scheduler, Workers | > 100k execuções/dia |
| **Temporal** | Muito alta | ~2 semanas | Server, banco, SDK | Workflows com compensação (Saga) |

## Decisão

**n8n**, pelos motivos abaixo:

1. **Uma peça de infraestrutura.** O n8n roda em um container único. O Airflow
   precisaria de Postgres, Redis, scheduler e workers para o mesmo resultado.
2. **O workflow é um arquivo.** O pipeline inteiro é um JSON versionável, que
   aparece em diff de pull request e é importável por CLI — o que permite testar
   e promover a mesma definição entre ambientes.
3. **A resiliência é declarativa.** `retryOnFail`, `maxTries`, batching e
   `onError` são configuração, não código.
4. **O volume alvo não justifica mais.** O caso de uso é sincronização em lote
   de dezenas a centenas de registros por execução.

## Consequências

**Positivas:** deploy simplificado, nada além do Docker para manter, workflow
versionado e revisável.

**Negativas:** o n8n Community não roda em modo fila sem licença, então não há
escala horizontal nem alta disponibilidade. Acima de ~100k execuções/dia, ou
quando o workflow precisar de compensação transacional, ele deixa de servir.

## Caminho de migração

Toda a regra de negócio deste pipeline vive nos dois Code nodes do workflow
(`Filtrar Domínios` e `Transformar para Schema CRM`), que é justamente o que
torna a troca de orquestrador viável. Se o volume ou a complexidade crescerem a
ponto de o n8n deixar de servir:

1. Extrair esses Code nodes para um serviço versionado e testável por fora do n8n
2. Empacotar esse serviço como activity no Temporal
3. Manter o webhook como entrada e enfileirar no Temporal

Não há razão para começar por aí enquanto o volume couber confortavelmente no
n8n.
