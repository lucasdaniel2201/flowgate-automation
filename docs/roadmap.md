# Roadmap

> Last updated: 2026-06-22

## ✅ Done (v1.0)

- [x] TypeScript strict mode migration
- [x] Strategy Pattern (DiscountCalculator)
- [x] Zod runtime validation
- [x] Pino structured logging
- [x] Vitest test suite (> 95% coverage)
- [x] ESLint + Prettier + Husky + Commitlint
- [x] Docker healthcheck + resource limits
- [x] GitHub Actions CI pipeline
- [x] Dependabot (npm + Docker + Actions)
- [x] ADRs (0001: n8n choice, 0002: resilience strategy)
- [x] Professional README with badges
- [x] Security policy + .env JSON schema

## 🚧 In Progress

- [ ] Helm chart for Kubernetes deployment
- [ ] OpenTelemetry distributed tracing

## 📅 Planned (v1.1)

- [ ] Publish as npm package (`@lucasdaniel/flowgate`)
- [ ] E2E tests with Testcontainers (n8n container)
- [ ] Grafana dashboard JSON template

## 🔮 Future (v2.0)

- [ ] Migrate to Temporal for > 100k executions/day
- [ ] Dead Letter Queue (SQS) for failed records
- [ ] Terraform modules for AWS EKS + RDS provisioning
- [ ] SSO integration (Keycloak / Auth0 OIDC)
- [ ] Multi-tenancy support (isolated workflows per tenant)

## 🎯 North Star

Become the reference implementation for "how to build a production-grade
n8n pipeline" — used by other engineers as a template for their own
automation projects.
