import { Timestamp } from "firebase/firestore"
import { z } from "zod"

/** Shape stored in Firestore (server-side). */
export const firestoreMessageSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  sender: z.string(),
  timestamp: z.instanceof(Timestamp),
})

/** JSON-safe message returned to the client. */
export const messageSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  sender: z.string(),
  timestamp: z.number(),
})

export type Message = z.infer<typeof messageSchema>
export type FirestoreMessage = z.infer<typeof firestoreMessageSchema>

export const toMessageDto = (doc: FirestoreMessage): Message => ({
  id: doc.id,
  text: doc.text,
  sender: doc.sender,
  timestamp: doc.timestamp.toMillis(),
})
