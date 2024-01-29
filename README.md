# NodeJS_Project

## Prerequisites

You will need Node.js and npm installed on your machine. You can download and install them from [https://nodejs.org/](https://nodejs.org/).

## Installation

1. Clone the repository:
    ```
    git clone git@devops.telecomste.fr:alhoz.sofiane/projet-nodejs_ezzar-alhoz.git
    ```
2. Navigate into the project directory:
    ```
    cd projet-nodejs_ezzar-alhoz
    ```
3. Install the dependencies:
    ```
    npm install express@4
    ```

## Starting the Project

1. To start the server, run:
    ```
    node index.js
    ```
2. Open your browser and navigate to `http://localhost:3000` (or whichever URL you've configured).

## Usage

Sign up or log in with an existing username and password.

Start chatting with other online users in real-time.

View the list of online users on the right side of the chat interface.

Chatt also in privacy by clicking on usernames.

## Features

User Authentication: Users can sign up and log in securely with a username and password.

Real-time Chat: Utilizes Socket.IO for real-time communication, enabling users to exchange messages instantly.

Persistent Data: Messages are stored in an SQLite database, ensuring that chat history is retained even if users disconnect and reconnect.

User List: Displays a list of online users, allowing participants to see who is currently connected.
