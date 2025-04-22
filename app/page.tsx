"use client"

import { useUser } from "@/context/UserContext"
import DisplayNamePrompt from "../components/DisplayNamePrompt"
import MessageInput from "../components/MessageInput"
import MessageList from "../components/MessageList"

export default function Home() {
  const { isLoggedIn } = useUser()

  return (
    <main className="min-h-screen bg-muted flex justify-center p-4">
      {!isLoggedIn ? (
        <DisplayNamePrompt />
      ) : (
        <div className="w-full max-w-md h-[90vh] flex flex-col bg-background shadow rounded-xl overflow-hidden">
          <div className="border-b p-4 font-semibold text-center sticky top-0 bg-background z-10">Chat app</div>
          <div className="flex-1 overflow-y-auto">
            <MessageList />
          </div>
          <MessageInput />
        </div>
      )}
    </main>
  )
}
