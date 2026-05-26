import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/features/**/adapters/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
  driver: 'expo',
});
