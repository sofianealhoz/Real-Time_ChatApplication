import { useState } from 'react';

// The message box. Another controlled form: `draft` is the single source of
// truth, and the input simply mirrors it.
export default function Composer({ onSend, onTyping }) {
  const [draft, setDraft] = useState('');

  function handleChange(event) {
    setDraft(event.target.value);
    onTyping(); // tell the server somebody is writing
  }

  function handleSubmit(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    onSend(text);
    setDraft(''); // empty the box once the message is on its way
  }

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <input
        className="composer-input"
        type="text"
        placeholder="Écrivez un message"
        value={draft}
        onChange={handleChange}
        maxLength={1000}
        autoFocus
      />

      <button className="composer-button" type="submit" disabled={!draft.trim()}>
        Envoyer
      </button>
    </form>
  );
}
