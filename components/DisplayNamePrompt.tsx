"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { useUser } from "@/context/UserContext"

const DisplayNamePrompt = () => {
  const { saveUser } = useUser()
  const [name, setName] = useState("")

  const handleSave = () => {
    saveUser(name)
  }

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-[400px] [&>button:last-child]:hidden">
        <DialogHeader>
          <DialogTitle>Welcome to the chat app</DialogTitle>
          <DialogDescription>Start by choosing a display name.</DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
        />
        <Button
          onClick={handleSave}
          disabled={!name}
          className="mt-2"
        >
          Start chat
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default DisplayNamePrompt
