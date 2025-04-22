"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

import { useUser } from "@/context/UserContext"
import { v4 as uuid } from "uuid"
import { sendMessage } from "@/services/ChatService"
import { Timestamp } from "firebase/firestore"

const MessageInput = () => {
  const { user, isLoggedIn } = useUser()
  const [text, setText] = useState("")

  const handleSend = async () => {
    if (!isLoggedIn) {
      toast.error("You need to be logged in to send messages.")
      return
    }

    const message = {
      id: uuid(),
      text,
      sender: user,
      timestamp: Timestamp.now(),
    }

    try {
      await sendMessage(message)
    } catch (err) {
      const error = err as Error
      toast.error(`Something went wrong: ${error.message}`)
    } finally {
      setText("")
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
            handleSend()
          }
        }}
        autoFocus
      />
      <Button
        onClick={handleSend}
        disabled={!text}
      >
        Send
      </Button>
    </div>
  )
}

export default MessageInput
