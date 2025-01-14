import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
})

export const setUserSchema = userSchema.extend({ id: z.string().optional() })
export type User = z.infer<typeof userSchema>
export type SetUser = z.infer<typeof setUserSchema>
