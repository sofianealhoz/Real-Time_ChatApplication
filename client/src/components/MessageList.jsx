import { useEffect, useRef } from 'react';
import Message from './Message.jsx';

export default function MessageList({ messages, currentUser }) {
  // A ref gives us a handle on a real DOM node, here the empty div sitting at
  // the very bottom of the list.
  const bottomRef = useRef(null);

  // Runs after every render where `messages` changed: scroll down so the newest
  // message is always visible.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list">
      {/* This wrapper is what pushes a short conversation down to the bottom of
          the panel instead of leaving it stuck at the top. */}
      <div className="message-list-inner">
        {messages.length === 0 && (
          <p className="empty-state">
            Aucun message pour le moment. Lancez la conversation.
          </p>
        )}

        {messages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            isMine={message.author === currentUser}
            // Consecutive messages from the same person are grouped: only the
            // first one of a run shows the name and the avatar.
            startsGroup={messages[index - 1]?.author !== message.author}
          />
        ))}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
