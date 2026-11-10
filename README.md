# Chat App 💬🔥

### ⚡Link: https://flamechat07.web.app/

A feature-rich **Angular + Firebase** social chat application built with **RxJS** for reactive data flows.  
Supports **private messaging**, profiles, posts, media sharing, and real-time notifications — with **EN/HU** language support.

---

## ✨ Key Features

### 🔐 Authentication & Accounts

- Register / Login / Logout
- Create profile (registration profile flow)
- Update profile (avatar, details)
- Set / change online status (availability)

### 💬 Private Chat

- 1:1 private messaging
- Send **text**, **images**, **videos**, and **voice messages**
- Archive conversations / messages
- Real-time updates via Firebase + RxJS streams

### 👥 Social & Profiles

- View friend profiles
- Album support (profile media / gallery)
- Share content directly with friends

### 📝 Posts & Feed

- Create posts as **Private** or **Shared/Public**
- Share **YouTube links** inside posts
- Comment on posts
- React to posts (likes / reactions)
- Share other users’ posts into your private posts page (re-share / repost)

### 🌍 Languages

- EN / HU language support (i18n)

### 🔔 Notifications & PWA

- Service Worker support (PWA-ready)
- Push / in-app notifications on **new incoming messages**
- Background-ready messaging UX (depending on browser permissions)

---

## 🧱 Tech Stack

- **Frontend:** Angular 21 + Angular Material 21
- **Reactive layer:** RxJS (Observables, streams, realtime UI)
- **Backend:** Firebase JS SDK 12 + AngularFire 21
  - Authentication
  - Firestore / Realtime Database (depending on your setup)
  - Storage (images, videos, voice messages)
  - Sending push notifications (if enabled)
- **PWA:** Angular Service Worker

---

## 🚀 Getting Started

### 1) Use a supported Node.js version

Use Node.js **22.22.3** (see `.nvmrc`). Angular 21 also supports Node.js
`^20.19.0` and `^24.0.0`; Node.js 26 is outside its supported range.

### 2) Configure the application

Copy `src/app/environments.example.ts` to `src/app/environments.ts` and fill in
your Firebase, API, push notification, EmailJS, and Gemini settings. The local
configuration is ignored by Git. The example values only allow compilation;
running the application requires your real project configuration.

### 3) Install dependencies and run

```bash
npm ci
npm start
```

### 4) Verify changes

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

The tests require Chrome or a Chromium browser specified with `CHROME_BIN`.

AngularFire 21 currently supports Angular 21.2 and Firebase JS SDK 12. Keep the
Angular packages on version 21 until AngularFire supports a newer major version.
