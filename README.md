# Real-Time Chat Application

Real-time chat application with live messaging and typing indicators, built
on WebSockets.

> **⚠️ Academic project — not production-ready.**
> This is a school project, kept public as a learning artifact. It is **not**
> hardened for real-world use and should not be deployed as-is.
>
> **Known limitations, deliberately documented:**
> - `chat.db` was committed early in the project and is **still tracked**.
>   It contains **dummy test accounts only** — no real users, no real
>   credentials, and the message tables are empty. Scheduled for removal from
>   tracking and from history (`.gitignore` already excludes `*.db`).
> - Sessions are not managed server-side: there is no session token or cookie,
>   so a client can call the socket API without a verified login.
> - No rate limiting, no CSRF protection, no HTTPS enforcement.
> - Messages are stored in plaintext in SQLite (no encryption at rest).
>
> **What has been fixed since:** passwords are now hashed with **bcrypt**
> (unique salt per user, cost factor 12) instead of being stored in plaintext,
> login no longer puts the password in the SQL query, account enumeration via
> error messages is prevented, and inputs are validated.

## Stack

- Node.js, Express
- WebSocket (real-time messaging)
- SQLite (storage)

## Prerequisites

Node.js and npm installed (https://nodejs.org/).

## Install and run

    git clone https://github.com/sofianealhoz/Real-Time_ChatApplication.git
    cd Real-Time_ChatApplication
    npm install
    npm start

Then open the application in your browser.

## Note

Team project (Telecom Saint-Etienne).
