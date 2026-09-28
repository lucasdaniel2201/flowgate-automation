# Roadmap

> Última atualização: 2026-09-28

## Pronto

- [x] Pipeline n8n com 6 nós: extração, filtro, transformação e carga
- [x] Resiliência em 3 camadas: retry (5x), batching (1 req/2s) e tolerância a falhas parciais
- [x] Docker Compose com healthcheck, limites de CPU/memória, rede isolada e volume nomeado
- [x] Importação idempotente do workflow por CLI, com ativação automática
- [x] Suíte de testes estáticos (23 testes, sem rede, sem containers)
- [x] Smoke test ponta a ponta e CI rodando os dois
- [x] ADRs das decisões estruturais
- [x] Dependabot para Docker e GitHub Actions
- [x] Imagem do n8n atualizada para a 1.123.82, dentro da baseline de segurança
      que o próprio n8n aponta (o bump passou pelos testes estáticos e pelo
      smoke test ponta a ponta)

## Planejado

- [ ] Autenticação no webhook — hoje `POST /webhook/iniciar` é aberto para quem alcança a porta
- [ ] Sink HTTP local para o smoke test não depender de rede externa
- [ ] Dashboard Grafana em JSON, usando as métricas que o n8n de fato expõe
- [ ] Dead Letter Queue para os itens que falham em todas as tentativas
- [ ] Retry do que ficou pendente, sem reprocessar o que já foi gravado

## Fora de escopo, por decisão

- **Substituir o batching por uma fila (Redis/RabbitMQ).** O volume alvo
  (dezenas a centenas de registros por execução) não justifica mais uma peça de
  infraestrutura para manter de pé. Ver
  [ADR-0002](decisions/0002-estrategia-resiliencia.md).
- **Alta disponibilidade / múltiplas réplicas do n8n.** O n8n Community não
  suporta execução em modo fila sem licença; o desenho aqui é uma instância só.
- **Substituir o `.env` por um gerenciador de secrets.** Faz sentido em
  produção com Vault/AWS Secrets Manager; aqui só somaria dependência.
