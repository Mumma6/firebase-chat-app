import "server-only"
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  Timestamp,
  where,
  type Query,
  type DocumentData,
} from "firebase/firestore"
import { v4 as uuid } from "uuid"
import { db } from "@/lib/firebase"
import { flowmark } from "@/lib/flowmark"
import { firestoreMessageSchema, toMessageDto, type Message } from "@/types/Message"
import { constants } from "@/lib/constants"
import { formatZodError } from "@/types/utils"

export type MessageCursor = {
  timestamp: number
  id: string
}

type LoadMode = "initial" | "older"

const encodeCursor = (cursor: MessageCursor): string => Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url")

export const decodeCursor = (value: string): MessageCursor => {
  const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as MessageCursor
  if (typeof parsed.timestamp !== "number" || typeof parsed.id !== "string") {
    throw new Error("Invalid cursor")
  }
  return parsed
}

/**
 * Load a page of chat messages: query Firestore, validate each document, return DTOs.
 * Instrumented with Flowmark — the strongest process-level fit in this app
 * (multi-step external read + validation with useful counts).
 */
export const loadMessages = async (options: { mode: LoadMode; cursor?: MessageCursor }) => {
  const flow = flowmark.workflow("chat.load-messages", {
    properties: {
      mode: options.mode,
      pageSize: constants.PAGE_SIZE,
    },
  })

  try {
    flow.step("started")

    const q = await flow.operation("build-query", async () => {
      const base = collection(db, constants.COLLECTION)
      if (options.mode === "initial") {
        return query(base, orderBy("timestamp", "desc"), limit(constants.PAGE_SIZE))
      }
      if (!options.cursor) {
        throw new Error("cursor is required for older pages")
      }
      const cursorTs = Timestamp.fromMillis(options.cursor.timestamp)
      return query(base, orderBy("timestamp", "desc"), startAfter(cursorTs), limit(constants.PAGE_SIZE))
    })

    const snap = await flow.operation("query-firestore", () => getDocs(q))

    const { messages, invalid } = await flow.operation("validate-documents", async () => {
      let invalidCount = 0
      const valid: Message[] = []

      for (const [i, doc] of snap.docs.entries()) {
        const parsed = firestoreMessageSchema.safeParse({ id: doc.id, ...doc.data() })
        if (parsed.success) {
          valid.push(toMessageDto(parsed.data))
        } else {
          invalidCount += 1
          console.warn(`Invalid doc at index ${i}:`, formatZodError(parsed.error))
        }
        flow.progress({
          completed: i + 1,
          total: snap.docs.length,
          unit: "documents",
        })
      }

      return { messages: valid.reverse(), invalid: invalidCount }
    })

    const last = snap.docs.at(-1)
    const nextCursor =
      last && messages.length === constants.PAGE_SIZE
        ? encodeCursor({
            timestamp: (last.data().timestamp as Timestamp).toMillis(),
            id: last.id,
          })
        : null

    flow.done({
      result: {
        fetched: snap.docs.length,
        valid: messages.length,
        invalid,
        hasMore: nextCursor !== null,
        mode: options.mode,
      },
    })

    return {
      messages,
      nextCursor,
      hasMore: nextCursor !== null,
    }
  } catch (err) {
    flow.fail({ code: "LOAD_MESSAGES_FAILED" })
    throw err
  }
}

/** Ordinary create — not Flowmark-instrumented (single write; request log is enough). */
export const sendMessage = async (input: { text: string; sender: string }) => {
  const id = uuid()
  const data = {
    id,
    text: input.text,
    sender: input.sender,
    timestamp: Timestamp.now(),
  }

  const validated = firestoreMessageSchema.safeParse(data)
  if (!validated.success) {
    const errorMessage = formatZodError(validated.error)
    throw new Error(errorMessage)
  }

  await addDoc(collection(db, constants.COLLECTION), validated.data)
  return toMessageDto(validated.data)
}

/** Poll for messages after a timestamp — simple read; not Flowmark-instrumented. */
export const fetchMessagesSince = async (sinceMs: number): Promise<Message[]> => {
  const q: Query<DocumentData> = query(
    collection(db, constants.COLLECTION),
    orderBy("timestamp", "asc"),
    where("timestamp", ">", Timestamp.fromMillis(sinceMs))
  )

  const snap = await getDocs(q)
  return snap.docs
    .map((doc) => firestoreMessageSchema.safeParse({ id: doc.id, ...doc.data() }))
    .flatMap((res, i) => {
      if (res.success) return [toMessageDto(res.data)]
      console.warn(`Invalid doc at ${i}:`, formatZodError(res.error))
      return []
    })
}
