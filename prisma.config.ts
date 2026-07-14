import { defineConfig, env } from 'prisma/config'

// Prisma 7: connection URL is provided here instead of schema.prisma
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env("DATABASE_URL"),
  },
})
