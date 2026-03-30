# 1-1 Interview Platform MVP Status Report

Based on the evaluation of the codebase at `d:\Projects\FSD-2`, here is the breakdown of what has been implemented and what is remaining for the MVP.

## ✅ What is Implemented

### 1. Authentication
- **Backend:** Express routes exist for traditional Login/Signup and Google Login (`userRouter.ts` and `userController.ts`). Prisma ORM and JWT are set up.
- **Frontend:** NextAuth is configured in `app/api/auth/[...nextauth]` and a Google Sign-in button is fully integrated on the landing page (`app/page.tsx`).

### 2. Room Management (Partial)
- **Backend:** Basic HTTP REST APIs exist for creating rooms, joining rooms, leaving rooms, fetching room details, and getting participants (`roomRouter.ts` and `roomController.ts`).

### 3. Real-time Signaling & Chat (Backend Only)
- **Backend Socket.io:** An active WebSocket server handles users joining rooms, limits rooms to 2 participants, routes WebRTC signaling (`webrtc-offer`, `webrtc-answer`, `ice-candidate`), and broadcasts `chat-message` events.

---

## ❌ What is Remaining (Not Implemented)

### 1. Interview Room (Frontend & Connection Logic)
- **Frontend UI:** There is no UI for users to view or join a unique room link (e.g., `/room/abc123`).
- **Role Management:** No logic currently enforces Interviewer vs. Candidate roles on the frontend.
- **Participant Limit Handling:** Backend now drops extra users, but frontend needs to handle the `room-full` socket event.

### 2. Video Call (MAIN FEATURE)
- **WebRTC Core:** No `RTCPeerConnection` or `navigator.mediaDevices` implementation exists in the frontend.
- **Frontend Signaling:** Missing `socket.io-client` implementation in the frontend to connect to the backend signaling server and handle WebRTC (offer/answer/ICE exchange).
- **Video UI:** No video elements, camera, or microphone toggles.

### 3. Live Chat (inside call)
- **Frontend Panel:** No chat UI panel in the frontend to send/receive messages in real-time, although the backend routing for `chat-message` is ready.

### 4. Scheduling (Optional MVP+)
- **Link Generation:** No UI or flow to generate and share interview links from the Dashboard.

### 5. Optional Tools
- **Monaco Editor:** Not installed or implemented.

## Summary
The backend database, Next.js setup, NextAuth, and **Socket.io real-time signaling infrastructure** are now in place. The next major step is building the **Frontend Video Call and Chat UI**, alongside integrating `socket.io-client` and standard `WebRTC` connections.
