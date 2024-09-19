// Chat.js
import React, { useState } from 'react';

const Chat = ({ users, groups, userType }) => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);

    const handleSelectChat = (chat) => {
        setSelectedChat(chat);
        // Load messages for the selected chat (You can load it from the backend or local state)
    };

    const handleSendMessage = (message) => {
        if (selectedChat) {
            // Update the message list (push to backend or append to local state)
            setMessages([...messages, { sender: userType, text: message }]);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-list">
                <h2>Chats</h2>
                <h3>Users</h3>
                {users.map((user) => (
                    <div key={user.id} onClick={() => handleSelectChat(user)}>
                        {user.name}
                    </div>
                ))}
                <h3>Groups</h3>
                {groups.map((group) => (
                    <div key={group.id} onClick={() => handleSelectChat(group)}>
                        {group.name}
                    </div>
                ))}
            </div>
            <div className="message-area">
                {selectedChat ? (
                    <>
                        <h3>Chat with {selectedChat.name}</h3>
                        <div className="messages">
                            {messages.map((msg, index) => (
                                <div key={index} className={`message ${msg.sender === userType ? 'me' : 'them'}`}>
                                    {msg.text}
                                </div>
                            ))}
                        </div>
                        <div className="message-input">
                            <input type="text" placeholder="Type a message..." onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSendMessage(e.target.value);
                                    e.target.value = '';
                                }
                            }} />
                        </div>
                    </>
                ) : (
                    <h3>Select a chat to view</h3>
                )}
            </div>
        </div>
    );
};

export default Chat;
