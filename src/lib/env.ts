// import "dotenv/config";
import { z } from 'zod'

const envSchema = z.object({
  VITE_FIREBASE_API_KEY: z.string(),
  VITE_FIREBASE_AUTH_DOMAIN: z.string(),
  VITE_FIREBASE_PROJECT_ID: z.string(),
  VITE_FIREBASE_STORAGE_BUCKET: z.string(),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string(),
  VITE_FIREBASE_APP_ID: z.string(),
  VITE_FIREBASE_MEASUREMENT_ID: z.string(),
})

export type Env = z.infer<typeof envSchema>

const { data: env, error } = envSchema.safeParse(import.meta.env)

if (error) {
  console.error('Invalid env:')
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2))
  process.exit(1)
}

export default env!
