## Descrição

<!-- O que este PR muda e por quê -->

## Issue relacionada

<!-- Fixes #123 -->

## Checklist

- [ ] A suíte de testes passa — `make test` (ou `node --test "tests/**/*.test.mjs"`)
- [ ] Se o workflow mudou, o smoke test passa — `make smoke-test` com o n8n no ar
- [ ] Se o workflow mudou, `typeVersion` continua dentro do que a imagem fixa suporta
- [ ] Novos testes cobrindo a mudança
- [ ] Documentação atualizada (README, `docs/`, ADR quando for decisão de arquitetura)
- [ ] Entrada no `CHANGELOG.md` em `[Unreleased]`
- [ ] Nenhum secret commitado (`.env` fora do versionamento)

## Como testar

```bash
make up
make test
make smoke-test
```

## Notas adicionais

<!-- Contexto, trade-offs, o que ficou de fora -->
