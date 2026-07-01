import { z } from 'zod'
import dotenv from 'dotenv'
import { loadVaultSecrets } from './vault'

dotenv.config()

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  REFRESH_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  FRONTEND_URL: z.string().min(1),
  METRICS_SECRET: z.string().min(1),
})

export type Env = z.infer<typeof schema>

// Populated by initEnv() before the server starts.
// All usages are property accesses (env.X), so the mutable object is safe.
export const env = {} as Env

export async function initEnv(): Promise<void> {
  const secrets = await loadVaultSecrets()
  Object.assign(process.env, secrets)
  Object.assign(env, schema.parse(process.env))
}
