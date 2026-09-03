import { colorFor, initialsOf } from '../avatar.js';

// Renders the list of connected people. Turning an array into a list of
// elements with .map() is the everyday pattern in React; the `key` lets React
// tell the rows apart when the list changes.
export default function UserList({ users, currentUser }) {
  return (
    <div className="user-list">
      <h2 className="user-list-title">En ligne, {users.length}</h2>

      <ul>
        {users.map((user) => (
          <li className="user-row" key={user}>
            <span className="avatar" style={{ backgroundColor: colorFor(user) }}>
              {initialsOf(user)}
            </span>
            <span className="user-name">
              {user}
              {user === currentUser && <span className="user-you">vous</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
