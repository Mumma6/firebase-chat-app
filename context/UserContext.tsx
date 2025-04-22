"use client"

import { createContext, useContext, useState } from "react"

type LoggedOutUser = {
  user: null
  isLoggedIn: false
  saveUser: (name: string) => void
}

type LoggedInUser = {
  user: string
  isLoggedIn: true
  saveUser: (name: string) => void
}

type UserContextType = LoggedInUser | LoggedOutUser

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null)

  const saveUser = (name: string) => {
    setUser(name)
  }

  const value: UserContextType = user ? { user, saveUser, isLoggedIn: true } : { user: null, saveUser, isLoggedIn: false }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
