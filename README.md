# Chat App

A real-time chat application built with Next.js, Shadcn and Firebase Firestore.

## Features

- Prompt for display name before entering chat
- Real-time updates using Firestore `onSnapshot`
- Loads only the 25 latest messages initially
- Scroll-anchored message list (bottom-aligned)
- Loads older messages on scroll-up
- Responsive UI using only basic React components (no design libraries)

## Tech Stack

- **Next.js** with **TypeScript**
- **Firebase Firestore** for real-time database
- **Tailwind CSS** and **shadcn/ui** for styling
- **Zod** for runtime schema validation

## Getting Started

1. Clone the repository  
   `git clone https://github.com/Mumma6/firebase-chat-app.git`

2. Install dependencies  
   `npm install`

3. Create a `.env.local` file in the root directory and add your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_COLLECTION=your-unique-collection-name
```

4. Start development server
   `npm run dev`