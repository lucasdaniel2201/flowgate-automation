# Contribuindo com o Flowgate Automation

Obrigado por considerar contribuir! 🚀

## Configuração do Ambiente

```bash
git clone https://github.com/lucasdaniel2201/flowgate-automation.git
cd flowgate-automation
npm install
cp .env.example .env
make up
```

## Padrões de Qualidade

- **TypeScript strict mode**: Todo código deve passar em `tsc --noEmit` com zero erros.
- **Testes**: Novas funcionalidades exigem testes.
- **Linting**: `npm run lint` deve passar com `--max-warnings 0`.
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).

## Checklist de Pull Request

- [ ] Branch segue a convenção (`feat/descricao-curta`, `fix/numero-da-issue`)
- [ ] Testes adicionados/atualizados
- [ ] `npm run check` passa
- [ ] Entrada no CHANGELOG adicionada (em `[Unreleased]`)
- [ ] Nenhum secret commitado

## Registros de Decisão de Arquitetura (ADRs)

Decisões significativas de design estão documentadas em `docs/decisions/`. Antes
de propor uma mudança grande, verifique os ADRs existentes para entender o contexto.

## Precisa de Ajuda?

Abra uma [discussão](https://github.com/lucasdaniel2201/flowgate-automation/discussions)
para perguntas. Para bugs, abra uma issue com o template de report de bug.
