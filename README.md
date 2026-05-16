# Real-Time Interview & Collaboration Platform

A full-stack real-time interview and collaboration platform built using modern web technologies.  
The platform enables users to create private interview rooms, communicate using real-time chat and video calls, and collaborate seamlessly during technical interviews.

---

# Features

## Authentication
- JWT-based authentication
- User registration & login
- Google OAuth login support
- Protected routes using middleware

## Room Management
- Create interview rooms
- Join private rooms
- Leave rooms
- Automatic room deactivation when empty
- Maximum 2 participants per room

## Real-Time Communication
- Real-time messaging using Socket.IO
- WebRTC signaling support
- Peer-to-peer video/audio communication using PeerJS
- ICE candidate exchange
- Offer/Answer handling

## Messaging
- Persistent room chat history
- Fetch previous messages
- Real-time message broadcasting

## Database
- PostgreSQL database
- Prisma ORM integration

## Networking
- Twilio STUN/TURN integration for reliable WebRTC connectivity

---

# Tech Stack

## Frontend
- Next.js
- TypeScript
- Tailwind CSS
- PeerJS
- Socket.IO Client

## Backend
- Node.js
- Express.js
- TypeScript
- Socket.IO
- Prisma ORM
- PostgreSQL

## Authentication
- JWT
- bcrypt
- Google OAuth

## Real-Time / WebRTC
- PeerJS
- WebRTC
- Twilio ICE Servers

---

# Environment Variables

Create a `.env` file in the root directory.

```env
DATABASE_URL=your_database_url

JWT_SECRET=your_jwt_secret

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_API_KEY=your_twilio_api_key
TWILIO_API_SECRET=your_twilio_api_secret
```

---

# Installation

## Clone Repository

```bash
git clone <your-repository-url>
cd <project-name>
```

## Install Dependencies

```bash
npm install
```

## Setup Prisma

```bash
npx prisma generate
npx prisma migrate dev
```

## Run Development Server

```bash
npm run dev
```

---

# Running the Server

```bash
npm run dev
```

Server runs on:

```bash
http://localhost:5000
```

---

# Security Features

- Password hashing using bcrypt
- JWT authentication
- Protected room routes
- User validation middleware
- Secure WebRTC signaling

---

# Scalability Considerations

- Modular backend architecture
- Real-time socket event handling
- Peer-to-peer media transfer
- Database abstraction with Prisma
- Easy integration with scalable SFU solutions in future

---
