import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp,getDoc,doc } from 'firebase/firestore';
import { firestore } from '../../firebase_setup/firebase';
import { getAuth } from 'firebase/auth';

const MessageBox = ({ chatId, visible, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch and subscribe to messages
  useEffect(() => {
    if (chatId) {
      const messagesRef = collection(firestore, `chats/${chatId}/messages`);
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(fetchedMessages);
      });

      return () => unsubscribe(); // Clean up subscription
    }
  }, [chatId]);

  // Handle sending a message
  const handleSendMessage = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    const userRef = doc(firestore, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!newMessage.trim()) return;

    const messageRef = collection(firestore, `chats/${chatId}/messages`);
    await addDoc(messageRef, {
      text: newMessage,
      sender: userSnap.data().email, // Replace with the actual sender's info
      timestamp: serverTimestamp(),
    });

    setNewMessage(''); // Clear input after sending
  };

  if (!visible) return null;

  return (
    <div style={styles.container}>
      <div style={styles.messageBox}>
        <h4>Chat Messages</h4>
        <div style={styles.messagesContainer}>
          {messages.map((msg) => (
            <p key={msg.id}><strong>{msg.sender}:</strong> {msg.text}</p>
          ))}
        </div>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={styles.textInput}
          placeholder="Type your message..."
        />
        <button onClick={handleSendMessage} style={styles.sendButton}>Send</button>
        <button onClick={onClose} style={styles.closeButton}>Close</button>
      </div>
    </div>
  );
};

// Styles for the MessageBox
const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // semi-transparent background
  },
  messageBox: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    width: '80%',
    maxWidth: '500px',
    textAlign: 'left', // Make sure the entire box aligns to the left
  },
  messagesContainer: {
    maxHeight: '170px',
    overflowY: 'auto',
    marginBottom: '10px',
    textAlign: 'left', // Ensures that messages stick to the left
    padding: '10px',
  },
  messageText: {
    textAlign: 'left', // Each message aligns to the left
    padding: '5px 0',
    margin: '0',
  },
  textInput: {
    width: '90%',
    height: '60px',
    marginBottom: '10px',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  sendButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '10px',
  },
  closeButton: {
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};


export default MessageBox;
