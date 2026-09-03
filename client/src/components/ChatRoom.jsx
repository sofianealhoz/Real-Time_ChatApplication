import UserList from './UserList.jsx';
import MessageList from './MessageList.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import Composer from './Composer.jsx';

// The chat layout. It receives everything it needs through props and holds no
// state of its own: it only arranges the pieces on screen.
export default function ChatRoom({ name, chat }) {
  const { messages, onlineUsers, typingUsers, isConnected, sendMessage, notifyTyping } = chat;

  // Arrivals and departures are displayed among the messages but are not
  // messages, so they are left out of the counter.
  const messageCount = messages.filter((message) => message.author !== 'system').length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark" />
          <span className="brand-name">Salon en direct</span>
        </div>

        <UserList users={onlineUsers} currentUser={name} />

        <div className={`connection-badge ${isConnected ? 'is-online' : 'is-offline'}`}>
          <span className="connection-dot" />
          {isConnected ? 'Connecté au serveur' : 'Reconnexion en cours'}
        </div>
      </aside>

      <main className="chat-panel">
        <header className="chat-header">
          <div>
            <h1 className="chat-title"># général</h1>
            <p className="chat-subtitle">
              {onlineUsers.length} personne{onlineUsers.length > 1 ? 's' : ''} en ligne
              {' · '}
              {messageCount} message{messageCount > 1 ? 's' : ''}
            </p>
          </div>
        </header>

        <MessageList messages={messages} currentUser={name} />

        <footer className="chat-footer">
          <TypingIndicator users={typingUsers} />
          <Composer onSend={sendMessage} onTyping={notifyTyping} />
        </footer>
      </main>
    </div>
  );
}
