# Flowgate Automation — Dockerfile
# Imagem minimal para disponibilizar o Makefile e scripts de utilidade.

FROM alpine:3.20

LABEL org.opencontainers.image.title="Flowgate Automation"
LABEL org.opencontainers.image.description="Pipeline ETL de usuários com n8n + Docker"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

# É uma imagem auxiliar — a pipeline real roda via docker compose com a imagem n8n.
CMD ["echo", "Flowgate Automation — use 'make up' para rodar o pipeline."]
