import React, { useState,useEffect  } from 'react';
import { useHistory } from 'react-router-dom';  // Import useHistory for navigation
import { addDoc, collection,getDocs } from 'firebase/firestore';  // Import Firestore methods
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';  // Firebase Storage methods
import { firestore, storage } from '../firebase_setup/firebase';  // Your Firebase setup
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


const CreateGroup = () => {
  const [groupname, setGroupname] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [description, setDescription] = useState('');

  const [teacher, setTeacher] = useState('');  
  const [fileDownloadUrl, setFileDownloadLink] = useState('');
  const [file, setFile] = useState('');


  {/* students section*/}
  const [listOfStudents, setListOfStudents] = useState([]);  // For storing selected student emails
  const [students, setStudents] = useState([]);  // All students fetched from Firestore
  const [filteredStudents, setFilteredStudents] = useState([]);  // Filtered list for search
  const [selectAll, setSelectAll] = useState(false);  // To handle the "Select All" functionality
  const [dropdownOpen, setDropdownOpen] = useState(false);  // Toggle dropdown visibility
  const [searchQuery, setSearchQuery] = useState(''); // For filtering students
 
  {/* clients section*/}
  const [client, setClient] = useState('');//select the single client from the list
  const [clients, setClients] = useState([]); //list of clients from the database
  const [searchClientQuery, setSearchClientQuery] = useState(''); // for searching client
  const [dropdownClientOpen, setDropdownClientOpen] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);  
  const [submit, setSubmit] = useState(false);  
  const[isfileUploading,setFileUploading] = useState(false);


  const history = useHistory(); 
  const auth = getAuth();

  // Fetch the teacher's name based on the current user
  useEffect(() => {
    const fetchTeacherName = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(firestore, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          // Assuming 'name' is the field where the teacher's name is stored
          setTeacher(userSnap.data().name);
        } else {
          console.log("No such user!");
        }
      }
    };

    fetchTeacherName();
  }, [auth]);
  useEffect(() => {
    
    const fetchStudents = async () => {
      try {
        const studentCollection = collection(firestore, 'users');  // Assuming students are in the 'users' collection
        const studentSnapshot = await getDocs(studentCollection);
        const studentsList = studentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Only include students
        const filteredStudents = studentsList.filter(student => student.role === 'student');
        setStudents(filteredStudents);
        setFilteredStudents(filteredStudents);  // Set filtered students as the initial list
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, []);
  useEffect(() => {
    const fetchClients = async () => {
      try{
        const clientsCollection = collection(firestore, 'users');  // Assuming students are in the 'users' collection
        const clientsSnapshot = await getDocs(clientsCollection);
        const clientsList = clientsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const filteredClients = clientsList.filter(client => client.role === 'client');
      setClients(filteredClients);
      setFilteredClients(filteredClients);
      }catch(error){
        console.error('Error fetching students:', error);
      }
      
      
    };
  
    fetchClients();
  }, []);

  // Handle filtering based on search query
  useEffect(() => {
    const filtered = students.filter((student) => {
      return student.name.toLowerCase().includes(searchQuery.toLowerCase());

    });
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  const handleCheckboxChange = (email) => {
    if (listOfStudents.includes(email)) {
      setListOfStudents(listOfStudents.filter((studentEmail) => studentEmail !== email));  // Deselect
    } else {
      setListOfStudents([...listOfStudents, email]);  // Select
    }
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);  // Toggle selectAll state
    if (!selectAll) {
      const allStudentEmails = students.map(student => student.email);  // Select all students
      setListOfStudents(allStudentEmails);
    } else {
      setListOfStudents([]);  // Deselect all students
    }
  };
  const isValidGroupData = (groupData) => {
    // Check if any required fields are empty, just spaces, or non-empty arrays where applicable
    const requiredFields = ['groupname', 'projectTitle', 'description', 'client','listOfStudents', 'teacher', 'fileDownloadUrl', 'chatId'];
    for (const field of requiredFields) {
      const value = groupData[field];
      // Check if the field is either undefined, null, empty string, or an empty array (for listOfStudents)
      if (value === undefined || value === null|| value === '') {
        return false;
      }
      // Special check for arrays to ensure they are not empty
      if (field === 'listOfStudents' && (!Array.isArray(value) || value.length === 0)) {
        return false;
      }
    }
    return true;
  };
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    try {
     
  
      // Initialize chat data for the group
      const chatData = {
        groupName: groupname, // Linking chat to the group name
        participants: [...listOfStudents, client, teacher], // Including all participants
        lastMessage: {
          text: "Welcome to the group chat!",
          sender: teacher,
          timestamp: new Date(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
  
      // Add chat to Firestore under 'chats' with a sub-collection for messages
      const chatRef = await addDoc(collection(firestore, 'chats'), chatData);
  
      // Create group data after obtaining the chatRef.id
      const groupData = {
        groupname,
        projectTitle,
        description,
        client,
        listOfStudents,  // Email addresses of selected students
        teacher,
        fileDownloadUrl: fileDownloadUrl,
        createdAt: new Date(),
        chatId: chatRef.id, // Include the chat ID in the group data
      };
  
      // Add group to Firestore
      if (isValidGroupData(groupData)) {
        try {
          // Add group to Firestore
          const docRef = await addDoc(collection(firestore, "groups"), groupData);
          console.log("Group created with ID: ", docRef.id);
    
          // Initialize the first message in the 'messages' sub-collection
          await addDoc(collection(firestore, `chats/${chatRef.id}/messages`), {
            text: "Welcome to the group chat!",
            sender: teacher,
            timestamp: new Date(),
            readBy: [teacher], // Initially, only the sender has 'read' the message
          });
          setSubmit(false);
          history.push('/teacher'); 
        } catch (error) {
          console.error("Error adding document: ", error);
        }
      } else {
        console.error("Invalid group data provided. All fields must be filled.");
        alert('One or many fields are empty');
        // Optionally handle the error by alerting the user or showing a message on the UI
      }
  
    
      
       
  
    } catch (error) {
      console.error('Error creating group:', error);
      setSubmit(false);
    }
  };
  

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No user logged in');
        return;
      }
      
      try {
        // Ensure no uploads are attempted when already submitting another form
        if (!submit) {
          setFileUploading(true);
          const storageRef = ref(storage, `groupFiles/${selectedFile.name}`);
          const snapshot = await uploadBytes(storageRef, selectedFile);
          const downloadURL = await getDownloadURL(snapshot.ref);
  
          // Update the state with the new download URL
          setFileDownloadLink(downloadURL);
          console.log("File uploaded to Firebase Storage. Download URL:", downloadURL);
  
          // Log success message
          console.log('File uploaded successfully');
          setFileUploading(false);
        } else {
          console.log('Submission in progress, file upload blocked.');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };
  useEffect(() => {
    console.log("Current file download URL:", fileDownloadUrl);
  }, [fileDownloadUrl]);  // Dependency array ensures this runs only when fileDownloadUrl changes
  
  
  


  const handleDeleteFile = () => {
    setFileDownloadLink(null);
  };

  const handleBack = () => {
    history.goBack();  // Navigate back to the previous page
  };
  const toggleClientDropdown = () => setDropdownClientOpen(!dropdownClientOpen);

const handleClientSelect = (clientEmail) => {
    setClient(clientEmail);
    toggleClientDropdown(); // Close dropdown after selection
};


useEffect(() => {
  // Filter clients based on search input
  
  const filtered = clients.filter(client =>
    client.name.toLowerCase().includes(searchClientQuery.toLowerCase())
  );
  setFilteredClients(filtered);
}, [searchClientQuery, clients]);





  return (
    <div style={styles.container}>
      <form onSubmit={isfileUploading?null:handleSubmit} style={styles.form}>
        <h1 style={styles.header}>Create Group</h1>
        {renderInput('Group Name:', groupname, setGroupname)}
        {renderInput('Project Title:', projectTitle, setProjectTitle)}
        {renderTextArea('Description:', description, setDescription)}
        {/* for client section */}
        <label style={styles.label}>
        Client:
        <div style={styles.dropdownContainer}>
            <div onClick={toggleClientDropdown} style={styles.dropdownHeader}>
                {client ? `Selected Client: ${client}` : 'Select Client'}
                <span style={styles.dropdownIcon}>{dropdownClientOpen ? '▲' : '▼'}</span>
            </div>

            {dropdownClientOpen && (
                <div style={styles.dropdown}>
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchClientQuery}
                        onChange={(e) => setSearchClientQuery(e.target.value)}
                        style={styles.searchInput}
                    />

                    {filteredClients.map((client) => (
                        <div key={client.email} style={styles.clientItem} onClick={() => handleClientSelect(client.email)}>
                            <span style={styles.clientName}>{client.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </label>
        
        {/* Students section */}
        <label style={styles.label}>
          List of Students:
          <div style={styles.dropdownContainer}>
            <div onClick={toggleDropdown} style={styles.dropdownHeader}>
              {listOfStudents.length > 0 ? `${listOfStudents.length} students selected` : 'Select Students'}
              <span style={styles.dropdownIcon}>{dropdownOpen ? '▲' : '▼'}</span>
            </div>

            {dropdownOpen && (
              <div style={styles.dropdown}>
                {/* Search Bar */}
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
                
                {/* Select All Checkbox */}
                <div style={styles.selectAllContainer}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                    Select All
                  </label>
                </div>

                {/* Filtered Students List */}
                {filteredStudents.map((student) => (
                  <div key={student.id} style={styles.studentItem}>
                    <img
                      src={student.profileImage || '/public/images/image_2024-09-17_142924314-removebg-preview.png'}
                      alt="Student"
                      style={styles.studentImage}
                      width={'20 px'}
                    />
                    <span style={styles.studentName}>{student.name}</span>
                    <label>
                      <input
                        type="checkbox"
                        checked={listOfStudents.includes(student.email)}
                        onChange={() => handleCheckboxChange(student.email)}
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </label>

        {/* File input */}
        {renderFileInput('File:', file, handleFileChange, handleDeleteFile)}

       



        <div style={styles.buttonGroup}>
          <button type="button" onClick={handleBack} style={styles.backButton}>Back</button>
          <button type="submit" style={styles.button} >Create</button>
        </div>
      </form>
    </div>
  );
};


const renderInput = (label, value, onChange, readOnly = false) => (
  <label style={styles.label}>
    {label}
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={styles.input}
      readOnly={readOnly}
    />
  </label>
);

const renderTextArea = (label, value, onChange) => (
  <label style={styles.label}>
    {label}
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={styles.textarea}
    />
  </label>
);

const renderFileInput = (label, file, onChange, onDelete) => (
  <label style={styles.label}>
    {label}
    <input
      type="file"
      onChange={onChange}
      style={styles.input}
    />
    {file && <button onClick={onDelete} style={styles.deleteButton}>Delete</button>}
  </label>
);

const styles = {
  label: {
    display: 'block',
    color: '#333',  // Dark text for better visibility on light background
    marginBottom: '20px'
},
dropdownContainer: {
    backgroundColor: '#fff',  // Light background for the dropdown
    borderRadius: '8px',
    padding: '10px',
    color: '#333',  // Dark text color for contrast
    position: 'relative',
    border:'1px solid #dadce0'
    
},
dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    cursor: 'pointer',
    alignItems: 'center',
    paddingBottom: '10px',
   
},
dropdownIcon: {
    marginLeft: '10px'
},
searchInput: {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    border: '1px solid #ddd',  // Light border for the input field
    borderRadius: '4px',
    color: '#333',  // Ensuring text is easily readable
    backgroundColor: '#f8f8f8'  // Slightly off-white background for the input to differentiate it
},
selectAllContainer: {
    marginBottom: '10px'
},
studentItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '5px'
},
studentImage: {
    borderRadius: '50%',
    marginRight: '10px',
    width: '30px',
    height: '30px'
},
studentName: {
    flexGrow: 1
},
dropdown: {
    maxHeight: '200px',
    overflowY: 'auto',
    padding: '10px'
},
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '',
  },
  form: {
    width: '100%',
    maxWidth: '600px',
    padding: '24px',
    margin: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
    boxSizing: 'border-box',
  },
  header: {
    marginBottom: '24px',
    color: '#202124',
    fontSize: '24px',
  },
  label: {
    display: 'block',
    marginBottom: '16px',
    color: '#202124',
    fontSize: '16px',
  },
  input: {
    width: '100%',
    padding: '10px 8px',
    fontSize: '16px',
    lineHeight: '24px',
    color: '#5f6368',
    backgroundColor: '#fff',
    border: '1px solid #dadce0',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    minHeight: '120px',
    padding: '10px 8px',
    fontSize: '16px',
    lineHeight: '24px',
    color: '#5f6368',
    backgroundColor: '#fff',
    border: '1px solid #dadce0',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  backButton: {
    marginRight: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f1f3f4',
    color: '#3c4043',
    border: '1px solid #dadce0',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  button: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  deleteButton: {
    marginLeft: '10px',
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f28b82',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  }
};

export default CreateGroup;
