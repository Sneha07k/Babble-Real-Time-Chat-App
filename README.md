# 💬 Babble – AI-Powered Real-Time Chat Application

Babble is a modern, full-stack real-time messaging application built with the MERN stack, Socket.IO, and Groq AI. It features instant one-to-one and group messaging, rich media sharing, voice notes, live user presence, public community channels, and integrated AI assistance.

![Babble Chat Interface](screenshots/babble-chat.png)

---

## 🌐 Live Demo

🚀 **Try Babble live:** [https://babble-cf3w.onrender.com](https://babble-cf3w.onrender.com)

> *Note: If the application hasn't been accessed recently, please allow 30–60 seconds for Render to wake up the free-tier service.*

---

## 🚀 Key Features

### 💬 Real-Time Messaging & Media
- **Instant Messaging:** Real-time delivery with Socket.IO and live typing indicators.
- **Media & Voice Notes:** Send images, videos, and record audio voice notes directly inside the chat (powered by Cloudinary).
- **Group Chats & Communities:** Create group conversations with custom icons, manage members, or explore public community rooms (Food, Tech, Random, etc.).
- **Live User Presence:** Real-time online/offline indicators with automated heartbeat checks.
- **Day Dividers & Timestamps:** WhatsApp-style clustered message bubbles with date separators and delivery checkmarks.

### 🤖 AI Assistance (Groq API)
- **Babble AI Contact:** An in-app AI assistant ready to answer questions, explain concepts, or brainstorm ideas directly within the chat.
- **Smart Reply Suggestions ("Ask AI"):** Generates quick, contextual response suggestions with one click.
- **Catch-Up Summarizer:** Summarizes unread and long chat histories into structured key takeaways and action points.

### 🔐 Authentication & Onboarding
- **Email & Password + OTP:** Sign up with email verification via one-time password (OTP) emails.
- **Google Sign-In:** Seamless single-click authentication using Google OAuth.
- **Personal Invite Links & QR Codes:** Share personal invite codes or scan QR codes to instantly connect with friends.
- **Password Hashing & JWT:** Passwords secured with bcrypt and sessions managed via JWT.

### 🎨 Personalization & UX
- **Theme Picker:** Choose from multiple curated themes and accent colors.
- **Chat Search & Filtering:** Filter chats by All, Unread, Groups, or Public Rooms.
- **Responsive Design:** Optimized for both mobile devices and desktop screens.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (bundled with Vite)
- **UI Components:** Chakra UI v3, Emotion
- **Networking & Real-Time:** Axios, Socket.IO Client
- **Auth & Media:** `@react-oauth/google`, Cloudinary, `qrcode.react`
- **Icons & Animation:** FontAwesome 6, React Icons, React Lottie

### Backend
- **Runtime:** Node.js, Express.js
- **Real-Time Engine:** Socket.IO
- **Database:** MongoDB & Mongoose
- **Authentication:** JSON Web Tokens (JWT), bcrypt.js, Google Auth Library
- **Email Delivery:** Nodemailer (OTP verification)
- **AI Integration:** Groq SDK (`llama-3.3-70b-versatile`)
- **Security:** Express rate limiters, input sanitization, protected routes

---

## 📸 Screenshots

### Chat Interface with Media & AI
![Babble Chat Interface](screenshots/babble-chat.png)

### Login & Authentication
<img width="640" height="316" alt="Login Page" src="https://github.com/user-attachments/assets/98a17e22-02df-43ed-aee4-5412c54f0c30" />

### Group Chat Management
<img width="640" height="314" alt="Group Chat" src="https://github.com/user-attachments/assets/451ec86c-e2c3-462a-9c5d-6cd2610b4f8b" />

### AI Message Suggestions
<img width="639" height="314" alt="AI Suggestions" src="https://github.com/user-attachments/assets/bc1f96b6-a699-4541-83b1-29e84a5290ea" />

### AI Chat Summarizer (Catch-Up)
<img width="640" height="314" alt="AI Chat Summary" src="https://github.com/user-attachments/assets/4638fd33-5e4b-47b7-9ce8-e3a113aaa727" />

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- MongoDB connection string (local or MongoDB Atlas)
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the Repository
```bash
git clone https://github.com/Sneha07k/Babble-Real-Time-Chat-App.git
cd Babble-Real-Time-Chat-App
```

### 2. Configure Environment Variables
Copy `.env.example` in both root and frontend folders:
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```
Fill in your credentials in `.env` (MongoDB URI, JWT secret, Groq API key, etc.).

### 3. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 4. Run the Application
In development, run the backend and frontend simultaneously:

```bash
# Terminal 1: Backend (runs on port 5000)
npm run start

# Terminal 2: Frontend (runs on port 3000 via Vite)
cd frontend
npm start
```

Visit `http://localhost:3000` to use Babble!

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
