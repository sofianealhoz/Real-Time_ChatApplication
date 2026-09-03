import { useState } from 'react';
import { useChat } from './hooks/useChat.js';
import JoinScreen from './components/JoinScreen.jsx';
import ChatRoom from './components/ChatRoom.jsx';

// The whole application in one decision: as long as we have no name, we show
// the join screen; once we have one, we show the chat room.
export default function App() {
  const [name, setName] = useState('');

  // The hook stays connected for as long as the name does not change.
  const chat = useChat(name);

  if (!name) {
    return <JoinScreen onJoin={setName} />;
  }

  return <ChatRoom name={name} chat={chat} />;
}
