import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Message } from "@/types/Message"
import { fetchInitialMessages, loadOlderMessages, listenToNewMessages } from "@/services/ChatService"
import { QueryDocumentSnapshot, Timestamp } from "firebase/firestore"
import { constants } from "@/lib/constants"

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleNext = async () => {
    if (loading || !hasMore) {
      return
    }
    if (debounceTimeout.current) {
      return
    }

    debounceTimeout.current = setTimeout(() => {
      debounceTimeout.current = null
    }, 1000)

    try {
      setLoading(true)

      if (!initialLoadDone) {
        const { messages, lastDoc } = await fetchInitialMessages()
        setMessages(messages)
        setLastDoc(lastDoc)
        setHasMore(messages.length === constants.PAGE_SIZE)
        setInitialLoadDone(true)

        setTimeout(() => {
          scrollToBottom()
          setTimeout(() => setHasScrolled(true), 400)
        }, 300)
      } else if (hasScrolled && lastDoc) {
        const { messages: older, lastDoc: newLast } = await loadOlderMessages(lastDoc)
        setMessages((prev) => [...older, ...prev])
        setLastDoc(newLast)
        setHasMore(!!newLast)
      }
    } catch (err) {
      console.error("❌ Failed to fetch messages:", err)
      toast.error("Failed to fetch messages.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialLoadDone) {
      return
    }

    const initialNow = Timestamp.now()
    const unsub = listenToNewMessages(
      initialNow,
      (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev
          }
          return [...prev, newMsg]
        })
        setTimeout(() => scrollToBottom(), 100)
      },
      (error) => {
        console.error("❌ Realtime error:", error)
        toast.error("Could not listen to new messages.")
      }
    )

    return () => unsub()
  }, [initialLoadDone, messages])

  return {
    messages,
    loading,
    hasMore,
    handleNext,
    scrollToBottom,
    bottomRef,
  }
}
