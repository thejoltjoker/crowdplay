import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const EnvSchema = z.object({});

export type Env = z.infer<typeof EnvSchema>;

const { data: env, error } = EnvSchema.safeParse(process.env);

if (error) {
  console.error("❌ Invalid env:");
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  throw new Error("Invalid env");
}

export default env!;
