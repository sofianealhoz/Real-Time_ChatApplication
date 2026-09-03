import { colorFor, initialsOf } from '../avatar.js';

// SQLite stores the date in UTC as "2026-09-03 21:40:12". This turns it into
// the reader's local time, shown as "21:40".
function formatTime(createdAt) {
  const date = new Date(`${createdAt.replace(' ', 'T')}Z`);
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function Message({ message, isMine, startsGroup }) {
  // Arrivals and departures are stored like any other message, but displayed
  // as a discreet line in the middle of the conversation.
  if (message.author === 'system') {
    return <p className="system-message">{message.body}</p>;
  }

  return (
    <div className={`message ${isMine ? 'is-mine' : ''} ${startsGroup ? 'starts-group' : ''}`}>
      <span
        className="avatar message-avatar"
        style={{ backgroundColor: colorFor(message.author) }}
      >
        {initialsOf(message.author)}
      </span>

      <div className="message-content">
        {startsGroup && (
          <div className="message-meta">
            <span className="message-author">{isMine ? 'Vous' : message.author}</span>
            <span className="message-time">{formatTime(message.created_at)}</span>
          </div>
        )}

        <div className="bubble">{message.body}</div>
      </div>
    </div>
  );
}
