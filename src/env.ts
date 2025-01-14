import { z } from "zod";

const EnvSchema = z.object({
  VITE_API_KEY: z.string(),
  VITE_AUTH_DOMAIN: z.string(),
  VITE_PROJECT_ID: z.string(),
  VITE_STORAGE_BUCKET: z.string(),
  VITE_MESSAGING_SENDER_ID: z.string(),
  VITE_APP_ID: z.string(),
  VITE_MEASUREMENT_ID: z.string(),
});

export type env = z.infer<typeof EnvSchema>;

const { data: env, error } = EnvSchema.safeParse(import.meta.env);

if (error) {
  console.error("❌ Invalid env:");
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  throw new Error("Invalid env");
}

export default env!;
