"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Message } from "@/types/Message"

type LoadResponse = {
  messages: Message[]
  nextCursor: string | null
  hasMore: boolean
}

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const latestTimestampRef = useRef(0)

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
        const res = await fetch("/api/messages?mode=initial")
        if (!res.ok) throw new Error("Failed to fetch messages")
        const data = (await res.json()) as LoadResponse
        setMessages(data.messages)
        setNextCursor(data.nextCursor)
        setHasMore(data.hasMore)
        setInitialLoadDone(true)
        if (data.messages.length > 0) {
          latestTimestampRef.current = Math.max(...data.messages.map((m) => m.timestamp))
        } else {
          latestTimestampRef.current = Date.now()
        }

        setTimeout(() => {
          scrollToBottom()
          setTimeout(() => setHasScrolled(true), 400)
        }, 300)
      } else if (hasScrolled && nextCursor) {
        const res = await fetch(`/api/messages?mode=older&cursor=${encodeURIComponent(nextCursor)}`)
        if (!res.ok) throw new Error("Failed to fetch older messages")
        const data = (await res.json()) as LoadResponse
        setMessages((prev) => [...data.messages, ...prev])
        setNextCursor(data.nextCursor)
        setHasMore(data.hasMore)
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err)
      toast.error("Failed to fetch messages.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!initialLoadDone) {
      return
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/messages?since=${latestTimestampRef.current}`)
        if (!res.ok) return
        const data = (await res.json()) as { messages: Message[] }
        if (data.messages.length === 0) return

        setMessages((prev) => {
          const existing = new Set(prev.map((m) => m.id))
          const fresh = data.messages.filter((m) => !existing.has(m.id))
          if (fresh.length === 0) return prev
          latestTimestampRef.current = Math.max(latestTimestampRef.current, ...fresh.map((m) => m.timestamp))
          setTimeout(() => scrollToBottom(), 100)
          return [...prev, ...fresh]
        })
      } catch (err) {
        console.error("Realtime poll error:", err)
      }
    }

    const id = setInterval(poll, 2000)
    return () => clearInterval(id)
  }, [initialLoadDone])

  return {
    messages,
    loading,
    hasMore,
    handleNext,
    scrollToBottom,
    bottomRef,
  }
}
