// Shows "Untel est en train d'écrire" while somebody is typing. Rendering
// nothing at all is done by returning null.
export default function TypingIndicator({ users }) {
  if (users.length === 0) return null;

  const label =
    users.length === 1
      ? `${users[0]} est en train d'écrire`
      : `${users.slice(0, 2).join(' et ')} sont en train d'écrire`;

  return (
    <div className="typing-indicator">
      <span className="typing-dots">
        <span />
        <span />
        <span />
      </span>
      {label}
    </div>
  );
}
