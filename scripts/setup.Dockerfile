# image สำหรับ docker compose run --rm setup: มี Node + Docker CLI เพื่อเปิดเว็บต่อได้ทันที
FROM docker:27-cli
RUN apk add --no-cache nodejs
WORKDIR /app
ENTRYPOINT []
