import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  QueryDocumentSnapshot,
  startAfter,
  Timestamp,
  Query,
  DocumentData,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Message, messageSchema } from "@/types/Message"
import { constants } from "@/lib/constants"
import { formatZodError } from "@/types/utils"

const fetchMessagesFromQuery = async (q: Query<DocumentData>) => {
  try {
    const snap = await getDocs(q)

    const messages = snap.docs
      .map((doc) => messageSchema.safeParse({ id: doc.id, ...doc.data() }))
      .map((res, i) => (res.success ? res.data : (console.warn(`❌ Invalid doc at index ${i}:`, formatZodError(res.error)), null)))
      .filter((m): m is Message => m !== null)
      .reverse()

    return {
      messages,
      lastDoc: snap.docs.at(-1) ?? null,
    }
  } catch (err) {
    console.error("🔥 Failed to fetch messages:", err)
    throw err
  }
}

export const sendMessage = async (message: Message) => {
  const validated = messageSchema.safeParse(message)

  if (!validated.success) {
    const errorMesage = formatZodError(validated.error)
    console.error("Invalid message data:", errorMesage)
    throw new Error(errorMesage)
  }

  return await addDoc(collection(db, constants.COLLECTION), validated.data)
}

export const listenToNewMessages = (afterTimestamp: Timestamp, onNewMessage: (msg: Message) => void, onError?: (error: Error) => void) => {
  const q = query(collection(db, constants.COLLECTION), orderBy("timestamp", "asc"), startAfter(afterTimestamp))

  return onSnapshot(
    q,
    (snapshot) => {
      snapshot.docs
        .map((doc) => messageSchema.safeParse({ id: doc.id, ...doc.data() }))
        .forEach((res, i) => {
          if (res.success) onNewMessage(res.data)
          else console.warn(`❌ Invalid doc at ${i}:`, formatZodError(res.error))
        })
    },
    onError
  )
}

export const fetchInitialMessages = async () => {
  const q = query(collection(db, constants.COLLECTION), orderBy("timestamp", "desc"), limit(constants.PAGE_SIZE))
  return fetchMessagesFromQuery(q)
}

export const loadOlderMessages = async (lastDoc: QueryDocumentSnapshot) => {
  const q = query(collection(db, constants.COLLECTION), orderBy("timestamp", "desc"), startAfter(lastDoc), limit(constants.PAGE_SIZE))
  return fetchMessagesFromQuery(q)
}
