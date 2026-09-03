import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// How long we wait after the last keystroke before telling the server that the
// user stopped typing.
const TYPING_PAUSE_MS = 1200;

/**
 * Custom hook: everything about the live connection lives here, so the
 * components below only ever deal with plain data (a list of messages, a list
 * of users) and never with the socket itself.
 *
 * @param {string} name  the display name, or an empty string before joining
 */
export function useChat(name) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // A ref holds a value across renders without triggering a new render.
  const socketRef = useRef(null);
  const lastMessageId = useRef(0);
  const typingTimer = useRef(null);

  useEffect(() => {
    // Nothing to connect to until the visitor has picked a name.
    if (!name) return;

    const socket = io({
      // Sent on every connection attempt, including automatic reconnections.
      // It tells the server the last message we already have.
      auth: (send) => send({ lastMessageId: lastMessageId.current }),
    });
    socketRef.current = socket;

    // Adds messages we do not already have, and remembers the highest id.
    function appendMessages(incoming) {
      if (incoming.length === 0) return;

      setMessages((previous) => {
        const knownIds = new Set(previous.map((message) => message.id));
        const fresh = incoming.filter((message) => !knownIds.has(message.id));
        return [...previous, ...fresh];
      });

      const highestId = Math.max(...incoming.map((message) => message.id));
      lastMessageId.current = Math.max(lastMessageId.current, highestId);
    }

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join', name);
    });
    socket.on('disconnect', () => setIsConnected(false));

    // Sent right after connecting: the messages we missed.
    socket.on('history', appendMessages);
    // Sent every time somebody posts.
    socket.on('message', (message) => appendMessages([message]));

    // Arrivals and departures. They are not stored in the database, so they get
    // a local id here: a string, which keeps them out of the `lastMessageId`
    // arithmetic and out of the replay on reconnection.
    socket.on('notice', (text) => {
      setMessages((previous) => [
        ...previous,
        { id: `notice-${Date.now()}-${previous.length}`, author: 'system', body: text },
      ]);
    });

    socket.on('presence', setOnlineUsers);
    socket.on('typing', setTypingUsers);

    // Cleanup: React runs this when the component unmounts, which closes the
    // connection instead of leaking it.
    return () => {
      clearTimeout(typingTimer.current);
      socket.disconnect();
    };
  }, [name]);

  function sendMessage(body) {
    socketRef.current?.emit('message', body);
    clearTimeout(typingTimer.current);
  }

  // Called on every keystroke: says "typing" once, then automatically says
  // "stopped" after a short pause.
  function notifyTyping() {
    socketRef.current?.emit('typing', true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('typing', false);
    }, TYPING_PAUSE_MS);
  }

  return {
    messages,
    onlineUsers,
    // Never show the current user their own typing indicator.
    typingUsers: typingUsers.filter((user) => user !== name),
    isConnected,
    sendMessage,
    notifyTyping,
  };
}
