import { Timestamp } from "firebase/firestore"
import { z } from "zod"

export const messageSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  sender: z.string(),
  timestamp: z.instanceof(Timestamp),
})

export type Message = z.infer<typeof messageSchema>
