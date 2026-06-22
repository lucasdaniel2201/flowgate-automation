# Política de Segurança

## Versões Suportadas

Apenas a versão mais recente recebe patches de segurança.

| Versão | Suportada          |
| ------ | ------------------ |
| 1.x    | :white_check_mark: |
| 0.x    | :x:                |

## Reportando uma Vulnerabilidade

**Não abra uma issue pública.** Envie um relatório detalhado para
[INSERIR EMAIL DE SEGURANÇA] com:

- Passos para reproduzir
- Versão(ões) afetada(s)
- Impacto potencial

Você receberá uma confirmação em até 48 horas e um cronograma
para correção em até 5 dias úteis.

## Medidas de Segurança em Vigor

- **Gestão de secrets**: Todas as credenciais ficam no `.env` (nunca commitadas).
  Um JSON Schema valida a estrutura do `.env`.
- **Varredura de dependências**: Dependabot monitora npm e imagens Docker
  semanalmente.
- **Hardening de container**: A imagem Docker executa como usuário non-root
  (`flowgate:flowgate`, UID 1001).
- **Pre-commit hooks**: Husky bloqueia commits que contenham secrets.
- **Sem tags `:latest`**: Versões de imagem Docker são fixadas para evitar
  breaking changes silenciosos.
- **Logging estruturado**: Pino ofusca automaticamente campos nomeados
  `password`, `token`, `secret` e `authorization`.

## Divulgação Responsável

Seguimos as diretrizes de [Divulgação de Vulnerabilidades do NCSC](https://www.ncsc.gov.uk/information/vulnerability-disclosure-toolkit).
