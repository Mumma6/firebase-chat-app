"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useUser } from "@/context/UserContext"

const MessageInput = () => {
  const { user, isLoggedIn } = useUser()
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!isLoggedIn || !text.trim() || sending) {
      if (!isLoggedIn) toast.error("You need to be logged in to send messages.")
      return
    }

    const payload = { text: text.trim(), sender: user }
    setText("")
    setSending(true)

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? "Failed to send message")
      }
    } catch (err) {
      const error = err as Error
      toast.error(`Something went wrong: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t bg-background p-4 flex gap-2">
      <Textarea
        placeholder="Write a message..."
        className="flex-1 resize-none"
        rows={1}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && text) {
            e.preventDefault()
            handleSend()
          }
        }}
        autoFocus
      />
      <Button
        onClick={handleSend}
        disabled={!text || sending}
      >
        Send
      </Button>
    </div>
  )
}

export default MessageInput
