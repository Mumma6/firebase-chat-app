import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { decodeCursor, fetchMessagesSince, loadMessages, sendMessage } from "@/services/ChatService"

const sendBodySchema = z.object({
  text: z.string().min(1),
  sender: z.string().min(1),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const since = searchParams.get("since")
    const cursor = searchParams.get("cursor")
    const mode = searchParams.get("mode") ?? "initial"

    if (since !== null) {
      const sinceMs = Number(since)
      if (!Number.isFinite(sinceMs)) {
        return NextResponse.json({ error: "Invalid since" }, { status: 400 })
      }
      const messages = await fetchMessagesSince(sinceMs)
      return NextResponse.json({ messages })
    }

    if (mode === "older") {
      if (!cursor) {
        return NextResponse.json({ error: "cursor required for older pages" }, { status: 400 })
      }
      const result = await loadMessages({ mode: "older", cursor: decodeCursor(cursor) })
      return NextResponse.json(result)
    }

    const result = await loadMessages({ mode: "initial" })
    return NextResponse.json(result)
  } catch (err) {
    console.error("GET /api/messages failed:", err)
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = sendBodySchema.safeParse(await request.json())
    if (!body.success) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 })
    }

    const message = await sendMessage(body.data)
    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    console.error("POST /api/messages failed:", err)
    const message = err instanceof Error ? err.message : "Failed to send message"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
