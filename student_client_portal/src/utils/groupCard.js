import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage methods
import { updateDoc,getDocs ,doc, where } from 'firebase/firestore'; // Firestore update methods
import { firestore, storage } from '../firebase_setup/firebase'; // Your Firebase setup
import React,{useState} from 'react';
import { collection,query} from 'firebase/firestore'; // Firestore functions
import MessageBox from '../components/chat/messageBox';


const GroupCard = ({groupName, projectTitle, studentEmails=[], description,fileUrl,client,isCreator,chatId}) => {
  const [isEditing, setIsEditing] = useState(false); // Control file upload form visibility
  const [newFileUrl, setNewFileUrl] = useState(fileUrl); // Track new file URL
  const [uploading, setUploading] = useState(false); // Track uploading state
  const [messageVisible, setMessageVisible] = useState(false);

  const [editableTitle, setEditableTitle] = useState(projectTitle);
const [editableDescription, setEditableDescription] = useState(description);


const handleSaveChanges = async () => {
  const groupsRef = collection(firestore, 'groups');
  const snapshot = await getDocs(groupsRef);
  const groupDoc = snapshot.docs.find(doc => doc.data().groupname === groupName);


  if (groupDoc) {
    await updateDoc(groupDoc.ref, {
      projectTitle: editableTitle,
      description: editableDescription
    });
    setIsEditing(false); // Turn off editing mode after saving
  }
};



    const [message, setMessage] = useState('');
    const showMessage = () => {
      setMessage('This is an important message!');
      setMessageVisible(true);
    };
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    setUploading(true);
    try {
      // Upload the file to Firebase Storage
      const storageRef = ref(storage, `group_files/${file.name}`);
      const filesnapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(filesnapshot.ref);
      console.log(groupName);
      // Log the download URL
      console.log("File uploaded to Firebase Storage:", downloadURL);
      
  
      // Fetch all groups and find the specific group by name
      const groupsRef = collection(firestore, 'groups');
      const snapshot = await getDocs(groupsRef);
      const groupDoc = snapshot.docs.find(doc => doc.data().groupname === groupName);
  
      if (groupDoc) {
        // Update the Firestore document
        await updateDoc(groupDoc.ref, { fileDownloadUrl: downloadURL });
        console.log('File URL updated in Firestore:', downloadURL);
        
  
        // Set new file URL in the state and stop editing
        setNewFileUrl(downloadURL);
        setIsEditing(false);
      } else {
        console.error('No matching group document found.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };
  
  
  return (
    <div style={styles.cardContainer}>
      <h2 style={styles.cardTitle}>{groupName}</h2>

      {!isEditing ? (
        <>
          <h4 style={styles.cardSubtitle}>Project Title: {editableTitle}</h4>
          <p><strong>Description:</strong> {editableDescription}</p>
        </>
      ) : (
        <>
          <input 
            type="text" 
            value={editableTitle} 
            onChange={(e) => setEditableTitle(e.target.value)} 
            style={styles.input}
            placeholder="Enter project title here..."
          />
          <textarea 
            value={editableDescription} 
            onChange={(e) => setEditableDescription(e.target.value)} 
            style={styles.textarea}
            placeholder="Enter project description here..."
          />
          {/* Save Changes button is added here within the editing block */}
          <button onClick={handleSaveChanges} style={styles.saveButton}>
            Save Changes
          </button>
        </>
      )}
      
      <p><strong>Students:</strong> {studentEmails.join(', ')}</p>
      <p><strong>Client:</strong> {client}</p>
      {isEditing && (
        <div style={styles.fileUploadContainer}>
          <input type="file" onChange={handleFileChange} />
          {uploading && <p>Uploading...</p>} {/* Show uploading status */}
        </div>
      )}

      <div style={styles.buttonGroup}>
        <button onClick={() => window.open(fileUrl, "_blank")} style={styles.viewButton}>View File</button>
        <a href={fileUrl} download style={styles.downloadLink}>Download</a>
        <button style={styles.chatButton} onClick={showMessage}>Open Chat</button>
        <MessageBox 
          chatId={chatId} 
          visible={messageVisible} 
          onClose={() => setMessageVisible(false)} 
        />
        
        {isCreator && (
          <button onClick={() => setIsEditing(!isEditing)} style={styles.editButton}>
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>
    </div>
  );


};

const styles = {
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    margin: '20px',
    maxWidth: '600px',
    width: '100%',
  },
  chatButton: {
    padding: '10px 20px',
    backgroundColor: 'black',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  editButton: {
    padding: '10px 20px',
    backgroundColor: '#ffc107',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  cardTitle: {
    color: '#1a73e8',
    fontSize: '22px',
    marginBottom: '10px',
  },
  cardSubtitle: {
    color: '#333',
    fontSize: '18px',
    marginBottom: '10px',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '15px',
  },
  input: {
    padding: '10px',
    margin: '10px 0',
    width: '100%',
    boxSizing: 'border-box',
  },
  textarea: {
    padding: '10px',
    margin: '10px 0',
    width: '100%',
    height: '100px',
    boxSizing: 'border-box',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },

  viewButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  downloadLink: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#0077cc',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    textAlign: 'center'
  }
};

export default GroupCard;
