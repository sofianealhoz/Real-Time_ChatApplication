import { useState } from 'react';

// First screen: pick a name. `onJoin` is a function handed down by the parent,
// which is how a child component talks back to its parent in React.
export default function JoinScreen({ onJoin }) {
  // A controlled input: React holds the value, the input only displays it.
  const [name, setName] = useState('');

  function handleSubmit(event) {
    event.preventDefault(); // stop the browser from reloading the page
    const trimmed = name.trim();
    if (trimmed) onJoin(trimmed);
  }

  return (
    <div className="join-screen">
      <form className="join-card" onSubmit={handleSubmit}>
        <div className="join-logo">
          <span className="join-logo-dot" />
        </div>

        <h1 className="join-title">Salon en direct</h1>
        <p className="join-subtitle">
          Messagerie instantanée, sans rechargement de page.
        </p>

        <input
          className="join-input"
          type="text"
          placeholder="Votre prénom"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={24}
          autoFocus
        />

        {/* The button stays disabled until the field holds something. */}
        <button className="join-button" type="submit" disabled={!name.trim()}>
          Rejoindre le salon
        </button>

        <p className="join-hint">
          Ouvrez cette page dans deux onglets pour voir les messages arriver des
          deux côtés en même temps.
        </p>
      </form>
    </div>
  );
}
