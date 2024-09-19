import React, { useState ,useEffect} from 'react';
import { Link } from 'react-router-dom';
import { updateDoc,doc } from 'firebase/firestore'; // Firestore functions to fetch teacher data
import { getAuth,onAuthStateChanged,signOut } from 'firebase/auth'; 
import { collection, getDocs,query ,where} from 'firebase/firestore'; // Firestore functions
import { firestore,storage } from '../firebase_setup/firebase'; // Your Firestore setup
import { useHistory } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase Storage methods
import GroupCard from '../utils/groupCard';

const ProfileComponent = ({ clientData, profileImage, setProfileImage, fetchClientData}) => {
  const [editMode, setEditMode] = useState(false);
const [editedData, setEditedData] = useState({});
const handleChange = (event) => {
  const { name, value } = event.target;
  setEditedData(prev => ({ ...prev, [name]: value }));}
  const saveChanges = async () => {
    const userDocRef = doc(firestore, 'users', clientData.uid);  // Reference to the user's document
    console.log('this is the students uid', clientData.uid);
  
    const updatedData = {
      age: editedData.age || clientData.age,
      email: editedData.email || clientData.email,
      extraField: editedData.extraField || clientData.extraField,
      name: editedData.name || clientData.name,
      phone: editedData.phone || clientData.phone,
      profileImage: profileImage  // Assumes profileImage state is updated via handleImageUpload
    };
  
    try {
      await updateDoc(userDocRef, updatedData);
      console.log("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };
  
  
  const handleSaveChanges = () => {
    setEditMode(false);
    // Assuming saveChanges function exists and performs some operations
    saveChanges();
    fetchClientData();
    
  };

  const cancelEdit=()=>{
    setEditMode(false);
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    // Check if the selected file is an image
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif']; // You can add more image types if needed
    if (!validImageTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPEG, PNG, or GIF).");
      return;
    }

    try {
      const storageRef = ref(storage, `profile_images/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update Firestore document with new profile image URL
      const userDocRef = doc(firestore, 'users', clientData.uid);
      await updateDoc(userDocRef, { profileImage: downloadURL });

      setProfileImage(downloadURL);
      console.log("Image uploaded and profile updated with URL:", downloadURL);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };


  return (
    <div style={styles.fullContent}>
      <div style={styles.profileHeader}>
      
      <div style={styles.headerDetails}>
        <img src={profileImage || '/public/images/image_2024-09-17_142924314-removebg-preview.png'} alt="Profile" style={styles.profileImage} />
        <div style={styles.nameAndButtonContainer}>
          <h3>{clientData.name}</h3>
          
        </div>
      </div>
    </div>
    <div style={styles.profileDetails}>
        <div style={styles.profileSection}>
          <h4 style={styles.sectionHeader}>General Info</h4>
          {editMode ? (
            <>
              <p><strong>Email:</strong><input type="email" value={editedData.email || clientData.email} style={styles.input} name="email" onChange={handleChange} /></p>
              <p><strong>Contact:</strong><input type="text" value={editedData.phone || clientData.phone} style={styles.input} name="phone" onChange={handleChange} /></p>
              <p><strong>Age:</strong><input type="text" value={editedData.age || clientData.age} style={styles.input} name="age" onChange={handleChange} /></p>
              <p><strong>Faculty:</strong><input type="text" value={editedData.extraField || clientData.extraField} style={styles.input}name="extraField" onChange={handleChange} /></p>
              <h4>Upload Profile Photo</h4>
              <input type="file" onChange={handleImageUpload} />
              <div>
                <button style={styles.saveChangesButton} onClick={handleSaveChanges}>Save Changes</button>
                <button style={styles.cancelButton} onClick={cancelEdit}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <p><strong>Email:</strong> {clientData.email}</p>
              <p><strong>Contact:</strong> {clientData.phone}</p>
              <p><strong>Age:</strong> {clientData.age || 'N/A'}</p>
              <p><strong>Faculty:</strong> {clientData.extraField || 'N/A'}</p>
            </>
          )}
          {!editMode && (
            <button style={styles.editButton} onClick={() => { setEditMode(true); setEditedData(clientData); }}>
              Edit
            </button>
          )}
        </div>
        
      </div>
    </div>
  );
};

const ProjectsComponent = ({groupsData,clientData}) => {
  if (!groupsData) return <div>Loading...</div>; // Render loading state if data is undefined

 return (

  <div>

    {groupsData.map((groupInfo,index) => {
        // Check if current user is either the teacher or in the studentEmails list
        console.log("Teacher name",groupInfo.teacher);
        console.log("Current username",clientData?.name );


        const isInGroup =
      groupInfo.teacher?.trim().toLowerCase() === clientData?.name?.trim().toLowerCase() ||
      groupInfo.listOfStudents?.some(email => email.trim().toLowerCase() === clientData?.email?.trim().toLowerCase()) ||
      groupInfo.client?.trim().toLowerCase() === clientData?.email?.trim().toLowerCase();

          console.log("is the user in the group", isInGroup);
          console.log('this is the key',groupInfo.id);

        return (
          isInGroup && (
            <GroupCard
              key={groupInfo.id||index}
              groupName={groupInfo.groupname}
              projectTitle={groupInfo.projectTitle}
              studentEmails={groupInfo.listOfStudents}
              description={groupInfo.description}
              fileUrl={groupInfo.fileDownloadUrl}
              client={groupInfo.client}
              chatId={groupInfo.chatId}
            />
          )
        );
      })}
  </div>      
 );

};

const CommunicationsComponent = () => (
  <div style={styles.fullContent}>
    <h3>Communications</h3>
    <p>Interactive chat system to communicate with project teams or support staff.</p>
  </div>
);


  
const SupportComponent = () => (
  <div style={styles.fullContent}>
    <h3>Client Support</h3>
    <p>Contact details and emails for client-specific support.</p>
  </div>
);

const AnnouncementsWidget = () => (
  <div style={styles.fullContent}>
    <h3>Business Announcements</h3>
    <ul>
      <li>Upcoming project milestones.</li>
      <li>Updates on business operations or changes.</li>
    </ul>
  </div>
);

const ClientLandingPage = () => {
  const [activeSection, setActiveSection] = useState('announcements');
  const [profileImage, setProfileImage] = useState('');
  const [clientData, setClientData] = useState({}); // Changed from array to object
  const [loading, setLoading] = useState(true);
  const history = useHistory();
  const [groupsData, setGroups] = useState([]);

 
  useEffect(() => {
    const auth = getAuth(); // Initialize Firebase Auth
  
    // Wait for Firebase Auth to confirm user authentication state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in, fetch the teacher data from Firestore
        fetchClientData();
    fetchGroups();
      } else {
        console.log("No user is currently logged in");
        setLoading(false); // Stop loading if no user is logged in
      }
    });
  
    // Cleanup the subscription to avoid memory leaks
    return () => unsubscribe();
  }, []);

  
  const fetchGroups = async () => {
    try {
      // Assuming "groups" is your collection name in Firestore
      const groupsRef = collection(firestore, 'groups');
      const groupsSnapshot = await getDocs(groupsRef);

      const groupsList = groupsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('The group list',groupsList);

      setGroups(groupsList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching groups:', error);
      setLoading(false);
    }
  };

  const fetchClientData = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.log('No user is currently logged in');
      setLoading(false);
      return;
    }
    
    try {
      const userQuery = query(
        collection(firestore, 'users'),
        where('uid', '==', currentUser.uid),
        where('role', '==', 'client')
      );
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setClientData(userData);
        setProfileImage(userData.profileImage || null);
      } else {
        console.log('No matching user document found.');
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      console.log("User logged out successfully!");
      history.push('/login');
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Failed to log out!");
    }
  };



  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.home} onClick={() => setActiveSection('announcements')}>HOME</div>
        <div style={styles.portalName}>Client Portal</div>
        <div style={styles.menuItem} onClick={() => setActiveSection('profile')}>Profile</div>
        <div style={styles.menuItem} onClick={() => setActiveSection('projects')}>Projects</div>
        
        <div style={styles.menuItem} onClick={() => setActiveSection('support')}>Support</div>
        <button style={styles.logOutButton}  onClick={handleLogout} >Log out</button>
      </div>
      <div style={styles.content}>
      {activeSection === 'profile' && <ProfileComponent clientData={clientData} profileImage={profileImage} setProfileImage={setProfileImage} fetchClientData={fetchClientData} />}
        {activeSection === 'projects' && <ProjectsComponent groupsData={groupsData} clientData={clientData}/>}
        {activeSection === 'communications' && <CommunicationsComponent />}
        {activeSection === 'support' && <SupportComponent />}
        {activeSection === 'announcements' && <AnnouncementsWidget />}
      </div>
    </div>
  );
};

// Styles adapted from the provided StudentLandingPage styles
const styles = {
  profileImage:{
    width: '100px'
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Adjust the card width and grid layout
    gridGap: '20px',  // Add some spacing between cards
    padding: '20px',
  },
  groupCard: {
    flex: '1 0 300px',  // Ensures that each card takes up a minimum width of 300px
    boxSizing: 'border-box',
  },

  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f4f4f9',
  },
  profileSection: {
    padding:'10px',
    
    width: '60%',
    
  },


  profileDetails:{
    padding:'10px',
    
    width: '80%',
  },

  sectionHeader: {
    margin: '20px 0',
    fontWeight: 'bold',
    fontSize: '22px',
  },

  input: {
    margin: '0px',
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    width: '60%',
  },

  sidebar: {
    width: '255px',
    height: '100vh',
    backgroundColor: '#902bf5',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
  },

  logOutButton: {
    width: '60%',
    padding: '18px 0',
    backgroundColor: '#b30000', // Dark red for visibility
    color: 'white',
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: '20px', // Ensures it's pushed to the bottom with space
    borderRadius: '6px',
  },


  home: {
    color: 'white',
    marginBottom: '20px',
    fontSize: '24px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  portalName: {
    color: 'white',
    marginBottom: '40px',
    fontSize: '16px',
    textAlign: 'center',
  },

  editButton: {
    width: '10%',
   
    padding: '10px 0',
    backgroundColor: '#19B5FE', // Blue color for visibility
    color: 'white',
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: '20px', // Ensures it's pushed to the bottom with space
    borderRadius: '6px',
    position: 'relative', // Changed from absolute if needed, adjust accordingly
    left: '150px',
  },


  menuItem: {
    backgroundColor: '#902bf5',
    color: 'white',
    padding: '25px 0',
    margin: '20px 0',
    width: '90%',
    borderRadius: '8px',
    textAlign: 'center',
    textDecoration: 'none',
    
    fontSize: '18px',
    display: 'block',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2), 0 -4px 8px rgba(0,0,0,0.1), -4px 0 8px rgba(0,0,0,0.1), 4px 0 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px rgba(0,0,0,0.25), 0 -6px 12px rgba(0,0,0,0.15), -6px 0 12px rgba(0,0,0,0.15), 6px 0 12px rgba(0,0,0,0.15)',
    },
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },


  saveChangesButton: {
    
    padding: '10px 5px',
    backgroundColor: '#26cc00', // Blue color for visibility
    color: 'white',
    textAlign: 'center',
    cursor: 'pointer',
    marginTop: '10px',
    marginBottom: '10px', // Ensures it's pushed to the bottom with space
    borderRadius: '6px',
    position: 'relative', // Changed from absolute if needed, adjust accordingly
    
  },
  cancelButton: {
    width: '10%',
    padding: '10px 0',
    backgroundColor: 'grey', // Blue color for visibility
    color: 'white',
    textAlign: 'center',
    cursor: 'pointer',
    marginTop: '10px',
    marginLeft: '5px',
    marginBottom: '10px', // Ensures it's pushed to the bottom with space
    borderRadius: '6px',
    position: 'relative', 
  },

  fullContent: {
    width: '100%',
    padding: '40px 50px',
    margin: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
};

export default ClientLandingPage;
