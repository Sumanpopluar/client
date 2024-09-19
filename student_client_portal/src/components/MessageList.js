// MessageList.js
import React from 'react';

const MessageList = ({ groups, onSelectChat }) => {
  return (
    <div style={styles.messageListContainer}>
      <ul style={styles.chatList}>
        {groups.map((group) => (
          <li key={group.id} onClick={() => onSelectChat(group)}>
            {group.groupName}  
          </li>
        ))}
      </ul>
    </div>
  );
};

const styles = {
  messageListContainer: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  chatList: {
    listStyle: 'none',
    padding: 0,
  },
};

export default MessageList;
