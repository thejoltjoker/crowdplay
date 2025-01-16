import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({});

export type Env = z.infer<typeof EnvSchema>;

// eslint-disable-next-line node/no-process-env
const { data: env, error } = EnvSchema.safeParse(process.env);

if (error) {
  console.error("❌ Invalid env:");
  console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));
  throw new Error("Invalid env");
}

export default env!;
