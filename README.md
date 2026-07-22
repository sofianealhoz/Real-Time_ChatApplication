# Real-Time Chat Application

Real-time chat application with live messaging and typing indicators, built
on WebSockets.

> **Scope — demonstration application.**
> Built to explore real-time messaging over WebSockets. The scope is
> intentionally limited to that, so the following are known gaps rather than
> oversights, and the application is not meant to be deployed as-is.
>
> **Known limitations:**
> - `chat.db` was committed early in the project and has since been **removed
>   from tracking** (`.gitignore` excludes `*.db`). It only ever contained
>   **dummy test accounts** — no real users, no real credentials, and the
>   message tables were empty. It remains in the earlier commit history.
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
