import { z } from 'zod'

export const eventSchema = z.object({
  id: z.string().uuid(),
})

export const setEventSchema = eventSchema.extend({ id: z.string().optional() })

export type Event = z.infer<typeof eventSchema>
export type SetEvent = z.infer<typeof setEventSchema>
