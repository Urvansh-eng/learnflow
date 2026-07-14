import { defineConfig } from 'prisma/config'

// Prisma 7: connection URL is provided at runtime via DATABASE_URL env var
// The adapter is configured in lib/db.ts for the Prisma Client
export default defineConfig({
  schema: 'prisma/schema.prisma',
})
