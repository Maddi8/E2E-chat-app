import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Message from '../../components/message/Message';
import axios from 'axios';

const socket = io('http://localhost:3001'); // Connect to the server

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isChat, setIsChat] = useState(false);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');

  const userID = localStorage.getItem('id');

  const navigate = useNavigate();

  const retrieveMessages = async () => {
    const response = await fetch('http://localhost:3001/getMessages');
    const res = await response.json();
    const data = res.map(({ user, content, timestamp }) => ({ user, content, timestamp }));
    setMessages([...data]);
  }

  const retrieveUsers = async () => {
    const response = await fetch('http://localhost:3001/getUsers');
    const res = await response.json();
    const data = res.map(({ idusers, username, userkey, usermail }) => ({ idusers, username, userkey, usermail }));
    setUsers(data)
  }

  useEffect(() => {
    retrieveMessages();
    retrieveUsers();
    console.log("useEffet");

    // Listen for incoming messages
    const handleIncomingMessage = msg => {
      setMessages(prevMessages => [...prevMessages, msg]);
    };

    socket.on('privateChatStarted', () => {
      console.log('Private chat started');
      setIsChat(true);
      socket.on('chat message', handleIncomingMessage);
    })

    socket.on('disconnect', (reason) => {
      console.log('Disconnected due to: ', reason);
    });


    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      socket.off('privateChatStarted');
      socket.off('disconnect');
      socket.off('chat message', handleIncomingMessage);
    };
  }, [])

  const sendMessage = (e) => {
    e.preventDefault();
    const id = userID;
    // Send the message to the server
    socket.emit('chat message', { sender: id, content: message });

    // Update the local state
    setMessage('');
  };

  const logOut = () => {
    console.log("Logging out")
    socket.disconnect();
    navigate("/logout", { replace: true });
  }

  const createRoom = (receiverID) => {
    setCurrentUser(receiverID);
    socket.emit('privateChat', userID, receiverID);
  }

  return (
    <div className="p-1">
      <h1 className='text-3xl'>e2E Encrypted Chat</h1>
      <button className='bg-red-500 text-white' onClick={() => logOut()}>Log out</button>
      <p>{userID}</p>
      <section className='flex flex-col'>
        <p>Users</p>
        {users.map(user => <p key={`${user.username}-${user.idusers}`} onClick={() => createRoom(user.idusers)}>{user.username}</p>)}
      </section>
      <section>
        <label>
          Message:
          <input type="text" value={message} onChange={e => setMessage(e.target.value)} />
        </label>
        <button onClick={sendMessage}>Send</button>
        <button className='mx-2' onClick={retrieveMessages}>Retrieve</button>
      </section>
      <div>
        <ul>
          {messages.map((msg, index) => {
            const user = users.find(user => msg.sender == user.idusers);
            return (
              <Message
                key={`msg-${msg.sender}-${index}`}
                id={index}
                username={user ? user.username : 'Unknown'}
                message={msg.content}
                timestamp={msg.timestamp}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default ChatPage