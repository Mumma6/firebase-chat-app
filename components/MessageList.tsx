"use client"

import { useUser } from "@/context/UserContext"
import InfiniteScroll from "@/components/ui/expansions/InfiniteScroll"
import { Loader2 } from "lucide-react"
import clsx from "clsx"
import { useMessages } from "@/hooks/useMessages"

const MessageList = () => {
  const { user } = useUser()
  const { messages, loading, hasMore, handleNext, bottomRef } = useMessages()

  return (
    <div className="flex flex-col gap-2 px-4 py-2 overflow-y-auto flex-1">
      <InfiniteScroll
        isLoading={loading}
        hasMore={hasMore}
        next={handleNext}
        threshold={1}
        reverse
      >
        {hasMore && <Loader2 className="my-4 h-5 w-5 mx-auto animate-spin text-muted-foreground" />}
      </InfiniteScroll>

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={clsx(
            "max-w-[70%] rounded-xl px-4 py-2 text-sm",
            msg.sender === user ? "bg-primary/10 self-end text-right ml-auto" : "bg-muted self-start"
          )}
        >
          <div className="text-xs font-semibold text-muted-foreground">{msg.sender}</div>
          <div>{msg.text}</div>
        </div>
      ))}
      {messages.length === 0 && !loading && (
        <div className="text-muted-foreground text-sm text-center py-4">No messages yet, start chatting!</div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

export default MessageList
