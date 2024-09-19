import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Firebase Storage methods
import { collection, getDocs, query, where } from "firebase/firestore"; // Firestore functions
import { updateDoc,doc } from "firebase/firestore"; // Firestore functions to fetch teacher data
import { firestore, storage } from "../firebase_setup/firebase"; // Your Firestore setup

import GroupCard from "../utils/groupCard";

import { getAuth, onAuthStateChanged, signOut } from "firebase/auth"; // Import Firebase Auth to get current user
import { useHistory } from "react-router-dom";

// Teacher Landing Page Component
const TeacherLandingPage = () => {
  const [isHovered, setIsHovered] = useState(false); // State to track hover
  const [isGeneralClicked, setIsGeneralClicked] = useState(false); // State to manage if "General" is clicked
  const [isMessagesClicked, setIsMessagesClicked] = useState(false); // State to manage if "Messages" is clicked
  const [currentTab, setCurrentTab] = useState("chat"); // State to track current tab (chat or group)
  const [profileImage, setProfileImage] = useState(null); // State for profile image
  const [teacherData, setTeacherData] = useState([]); // State for storing teacher data from Firestore
  const [uploading, setUploading] = useState(false); // To show upload progress
  const [loading, setLoading] = useState(true); // Loading state to track when data is being fetched
  const [groups, setGroups] = useState([]);
  const [currentUserData, setCurrentUserData] = useState([]);
  const [editMode, setEditMode] = useState(false);
  

  const toggleEditMode=()=>{
    setEditMode(!editMode);
  }  
  const handleSaveChanges=()=>{
    saveChanges();
    setEditMode(false);
  }
  const saveChanges=async()=>{
    const auth = getAuth(); // Get the Firebase Auth instance
  const user = auth.currentUser; // Get the currently logged in user
  if (!user) {
    console.log("No user is logged in");
    return;
  }
  // Get a reference to the user document in Firestore
  const userDocRef = doc(firestore, "users", user.uid);

  // Prepare the data to be updated based on the latest state
  const updatedData = {
    name: teacherData[0].name,
    age: teacherData[0].age,
    email: teacherData[0].email,
    extraField: teacherData[0].extraField,
    contact: teacherData[0].phone
  };
  try {
    // Update the document in Firestore
    await updateDoc(userDocRef, updatedData);
    console.log("Document successfully updated!");
    
  } catch (error) {
    console.error("Error updating document: ", error);
  }

  }
  
  

  const fetchCurrentUser = async () => {
    const auth = getAuth();
    const uid = auth.currentUser.uid;

    try {
      const userQuery = query(
        collection(firestore, "users"),
        where("uid", "==", uid)
      );
      const querySnapshot = await getDocs(userQuery);
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setCurrentUserData(userData);
      } else {
        console.log("No matching user document found.");
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      setLoading(false);
    }
  };
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        // Assuming "groups" is your collection name in Firestore
        const groupsRef = collection(firestore, "groups");
        const groupsSnapshot = await getDocs(groupsRef);

        const groupsList = groupsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("The group list", groupsList);

        setGroups(groupsList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching groups:", error);
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const fetchTeacherData = async (currentUser) => {
    try {
      // Query the 'users' collection for the current user with the role 'teacher'
      const userQuery = query(
        collection(firestore, "users"),
        where("uid", "==", currentUser.uid),
        where("role", "==", "teacher")
      );
      console.log(query.toString);
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data(); // Get user data
        setTeacherData([userData]); // Set the teacher data in state

        if (userData.profileImage) {
          setProfileImage(userData.profileImage); // Set the profile image in state
        } else {
          console.log("No profile image found");
        }
      } else {
        console.log("No matching user document found for the current teacher.");
      }
    } catch (error) {
      console.error("Error fetching teacher data:", error);
    } finally {
      setLoading(false); // Stop loading once data is fetched
    }
  };
  const history = useHistory();
  const handleLogout = async () => {
    const auth = getAuth();

    try {
      await signOut(auth);
      console.log("User logged out successfully!");
      history.push("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Failed to log out!");
    }
  };

  // UseEffect to fetch data on component mount
  useEffect(() => {
    const auth = getAuth(); // Initialize Firebase Auth

    // Wait for Firebase Auth to confirm user authentication state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in, fetch the teacher data from Firestore
        fetchTeacherData(user);
        fetchCurrentUser(user);
      } else {
        console.log("No user is currently logged in");
        setLoading(false); // Stop loading if no user is logged in
      }
    });

    // Cleanup the subscription to avoid memory leaks
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <p>Loading...</p>; // Show a loading message while data is being fetched
  }

  // Handler for image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0]; // Get the file from the input
    if (file) {
      const auth = getAuth(); // Initialize Firebase Auth
      const currentUser = auth.currentUser; // Get the current authenticated user

      if (!currentUser) {
        console.log("No user is currently logged in");
        return;
      }

      try {
        // Upload the file to Firebase Storage
        const storageRef = ref(storage, `profile_images/${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log(
          "Image uploaded to Firebase Storage. Download URL:",
          downloadURL
        );

        // Query the 'users' collection for the current user with the role 'teacher'
        const userQuery = query(
          collection(firestore, "users"),
          where("uid", "==", currentUser.uid),
          where("role", "==", "teacher") // Ensure we're targeting only teachers
        );

        const querySnapshot = await getDocs(userQuery);

        if (!querySnapshot.empty) {
          // Assuming there's only one matching document for this user
          const userDocRef = querySnapshot.docs[0].ref; // Get the document reference

          console.log("User document found:", querySnapshot.docs[0].data());

          // Update the Firestore document with the profileImage field
          await updateDoc(userDocRef, { profileImage: downloadURL });

          // Optionally set the profile image in the state to display it immediately
          setProfileImage(downloadURL);

          console.log("Profile image updated successfully in Firestore!");
        } else {
          console.log(
            "No matching user document found for the current teacher."
          );
        }
      } catch (error) {
        console.error("Error uploading and updating profile image:", error);
      }
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }const handleCancel = () => {
    setEditMode(false);
    
  }


  // Toggle "General" section display
  const handleGeneralClick = () => {
    setIsGeneralClicked(!isGeneralClicked);
    setIsMessagesClicked(false); // Close messages when General is clicked
  };

  // Toggle "Messages" section display
  const handleMessagesClick = () => {
    setIsMessagesClicked(!isMessagesClicked);
    setIsGeneralClicked(false); // Close general when Messages is clicked
  };

  return (
    <div style={styles.container}>
      {/* Left Sidebar (Profile Section) */}
      <div style={styles.sidebar}>
        {/* Profile Photo Centered */}
        <img
          src={
            profileImage ||
            "/public/images/image_2024-09-17_142924314-removebg-preview.png"
          } // Replace with actual image source
          alt="Teacher Profile"
          style={styles.profilePhotoCentered}
        />

        {/* Teacher Name */}
        <h2 style={styles.teacherName}>
          {teacherData.map((teacher) => teacher.name)}
        </h2>

        {/* General Information Section */}
        <div
          style={styles.generalSection}
          onClick={handleGeneralClick} // Clickable "General" section
        >
          <h3 style={styles.generalTitle}>General</h3>
        </div>

        {/* Messages Section */}
        
      </div>

      {/* Main Section */}
      <div style={styles.mainContent}>
        {/* 
        \Create Group Button */}
        <Link
          to="/create-group"
          style={{
            ...styles.createGroupButton,
            backgroundColor: isHovered ? "#390270" : "#902bf5", // Change color based on hover state
          }}
          onMouseEnter={() => setIsHovered(true)} // Trigger hover
          onMouseLeave={() => setIsHovered(false)} // Remove hover
        >
          Create Group
        </Link>

        <div style={styles.gridContainer}>
          {groups.map((groupInfo, index) => {
            // Check if current user is either the teacher or in the studentEmails list
            console.log("Teacher name", groupInfo.teacher);
            console.log("Current username", currentUserData?.name);
            const isCreator = groupInfo.teacher === currentUserData?.name;

            const isInGroup =
              groupInfo.teacher?.trim().toLowerCase() ===
                currentUserData?.name?.trim().toLowerCase() ||
              groupInfo.listOfStudents?.some(
                (email) =>
                  email.trim().toLowerCase() ===
                  currentUserData?.email?.trim().toLowerCase()
              ) ||
              groupInfo.client?.trim().toLowerCase() ===
                currentUserData?.email?.trim().toLowerCase();

            console.log("is the user in the group", isInGroup);
            console.log("this is the key", groupInfo.id);
            console.log(groupInfo.fileDownloadUrl);

            return (
              isInGroup && (
                <GroupCard
                  // key={groupInfo.id||index}
                  groupName={groupInfo.groupname}
                  projectTitle={groupInfo.projectTitle}
                  studentEmails={groupInfo.listOfStudents}
                  description={groupInfo.description}
                  fileUrl={groupInfo.fileDownloadUrl}
                  client={groupInfo.client}
                  isCreator={isCreator}
                  chatId={groupInfo.chatId}
                />
                
              )
            );
          })}
        </div>

        {/* Display "General" Details if clicked */}

      {isGeneralClicked && (
  <div style={styles.generalDetails}>
    {/* Toggle Edit/Save Button */}
    <button 
      style={{
        ...styles.editButton, // Spread the existing CSS properties from editButton
        backgroundColor: editMode ? "#7CFC00" : "#00aaff", // Conditionally change background color
      }} 
      onClick={editMode ? handleSaveChanges : toggleEditMode}
    >
      {editMode ? "Save" : "Edit"}
    </button>
    

    <h3 style={styles.sectionHeader}>General Information</h3>
    <div style={styles.infoContainer}>
      {teacherData && teacherData.length > 0 ? (
        teacherData.map((teacher, index) => (
          <div key={teacher.uid || index} style={styles.infoBlock}>
            <label style={styles.label}><strong>Name:</strong></label>
            {editMode ? (
              <input 
                type="text" 
                value={teacher.name} 
                onChange={(e) => {
                  const newTeacherData = [...teacherData];
                  newTeacherData[index].name = e.target.value;
                  setTeacherData(newTeacherData);
                }}
                style={styles.input}
              />
            ) : (
              <span style={styles.value}> {teacher.name || "N/A"}</span>
            )}
            <br />

            <label style={styles.label}><strong>Age:</strong></label>
            {editMode ? (
              <input 
                type="text" 
                value={teacher.age} 
                onChange={(e) => {
                  const newTeacherData = [...teacherData];
                  newTeacherData[index].age = e.target.value;
                  setTeacherData(newTeacherData);
                }}
                style={styles.input}
              />
            ) : (
              <span style={styles.value}> {teacher.age || "N/A"}</span>
            )}
            <br />

            <label style={styles.label}><strong>Email:</strong></label>
            {editMode ? (
              <input 
                type="text" 
                value={teacher.email} 
                onChange={(e) => {
                  const newTeacherData = [...teacherData];
                  newTeacherData[index].email = e.target.value;
                  setTeacherData(newTeacherData);
                }}
                style={styles.input}
              />
            ) : (
              <span style={styles.value}> {teacher.email || "N/A"}</span>
            )}
            <br />

            <label style={styles.label}><strong>Department:</strong></label>
            {editMode ? (
              <input 
                type="text" 
                value={teacher.extraField} 
                onChange={(e) => {
                  const newTeacherData = [...teacherData];
                  newTeacherData[index].extraField = e.target.value;
                  setTeacherData(newTeacherData);
                }}
                style={styles.input}
              />
            ) : (
              <span style={styles.value}> {teacher.extraField || "N/A"}</span>
            )}
            <br />

            <label style={styles.label}><strong>Contact:</strong></label>
            {editMode ? (
              <input 
                type="text" 
                value={teacher.phone} 
                onChange={(e) => {
                  const newTeacherData = [...teacherData];
                  newTeacherData[index].phone = e.target.value;
                  setTeacherData(newTeacherData);
                }}
                style={styles.input}
              />
            ) : (
              <span style={styles.value}> {teacher.phone || "N/A"}</span>
            )}
            <br />
          </div>
        ))
      ) : (
        <p>No teacher data available</p> // Show message if no data is available
      )}
    </div>
    {/* Hide upload field unless in edit mode */}
    {editMode && (
      <>
        <h4>Upload Profile Photo</h4>
        <input type="file" onChange={handleImageUpload} style={styles.fileInput} />
        {uploading && <p>Uploading...</p>} {/* Show uploading progress */}
      </>
    )}
    {editMode?<>(<button style={styles.cancelButton} onClick={handleCancel}> Cancel</button>)</>:<></>}
    
  </div>
)}


        <button style={styles.editButton} onClick={handleLogout}>
          Log out
        </button>

        {/* Display "Messages" section if clicked */}
        {isMessagesClicked && (
          <div style={styles.messagesDetails}>
            {/* Tabs for Chat and Group */}
            <div style={styles.tabContainer}>Groups</div>
            <div style={styles.messageList}>
              <h3>Group Messages</h3>
              <ul style={styles.messagesList}>
                <li>Group Message 1: Project meeting tomorrow at 2 PM.</li>
                <li>
                  Group Message 2: Don’t forget to submit the assignments!
                </li>
              </ul>
            </div>
            {/* Display Chat or Group messages based on the selected tab */}
          </div>
        )}
      </div>
    </div>
  );
};

// CSS Styles as JS objects
const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#f4f4f9",
  },
  sidebar: {
    width: "25%",
    backgroundColor: "#902bf5",
    padding: "20px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center", // Center align items in the sidebar
  },
  sectionHeader: {
    margin: '20px 0',
    fontWeight: 'bold',
    fontSize: '22px',
  },

  infoContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  infoBlock: {
    marginBottom: '15px',
  },
  label: {
    fontWeight: 'bold',
    marginTop: '15px',
    marginRight: '10px',
    width: '100px',
    display: 'inline-block',
  },
  input: {
    margin: '6px',
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    width: '60%',
  },
  value: {
    padding: '8px',
  },
  fileInput: {
    marginTop: '10px',
  },

  profilePhotoCentered: {
    width: "150px", // Set the square dimension
    height: "150px",
    borderRadius: "50%", // Circular photo
    objectFit: "cover",
    marginBottom: "20px",
  },
  teacherName: {
    fontSize: "24px",
    color: "white",
    fontWeight: "bold",
    marginBottom: "20px",
    textAlign: "center", // Center the name
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)', // Creates two columns of equal width
    gridColumnGap: '20px', // Space between columns
    gridRowGap: '20px', // Space between rows
    width: '100%', // Ensure it takes full width
    marginTop: '60px', // Space below the 'Create Group' button
  },
  groupCard: {
    width:'200 px',
   
    boxSizing: "border-box",
  },
  generalSection: {
    cursor: "pointer",
    color: "#902bf5",
    padding: "13px",
    margin: "15px 0px",
    backgroundColor: "white",
    borderRadius: "10px",
    textAlign: "center",
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.2)", // Popping out effect
    transition: "all 0.3s ease", // Smooth transition
    width: "60%", // Centered section width
    marginBottom: "20px", // Space below for Messages
    //boxShadow: '0 4px 8px rgba(0,0,0,0.2), 0 -4px 8px rgba(0,0,0,0.1), -4px 0 8px rgba(0,0,0,0.1), 4px 0 8px rgba(0,0,0,0.1)',
  },
  generalTitle: {
    margin: "9px",
    fontSize: "18px",
    fontWeight: "bold",
  },
  messagesSection: {
    cursor: "pointer",
    color: "#902bf5",
    margin: "10px",
    padding: "13px",
    backgroundColor: "white",
    borderRadius: "10px",
    textAlign: "center",
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.2)", // Popping out effect
    transition: "all 0.3s ease", // Smooth transition
    width: "60%",
    //boxShadow: '0 4px 8px rgba(0,0,0,0.2), 0 -4px 8px rgba(0,0,0,0.1), -4px 0 8px rgba(0,0,0,0.1), 4px 0 8px rgba(0,0,0,0.1)',
  },
  messagesTitle: {
    margin: "9px",
    fontSize: "18px",
    fontWeight: "bold",
  },
  generalDetails: {
    position: "absolute", // Use absolute to position it relative to the nearest positioned ancestor
    top: "100px", // Adjust this value as needed
    left: "45%", // Center horizontally
    transform: "translateX(-50%)",
    width: "60%",
    backgroundColor: "#fff",
    padding: "50px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    borderRadius: "10px",
    zIndex: 2, // Higher than the content below
  },
  messagesDetails: {
    position: "absolute", // Use absolute to position it relative to the nearest positioned ancestor
    top: "345px", // Adjust this value as needed
    left: "45%", // Center horizontally
    transform: "translateX(-50%)",
    width: "60%",
    backgroundColor: "#fff",
    padding: "50px",
    boxShadow: "6px 4px 8px rgba(0.1, 0.1, 0.1, 0.1)",
    borderRadius: "10px",
    zIndex: 2, // Higher than the content below
  },

  messagesList: {
    listStyle: "none",
    padding: 0,
    fontSize: "16px",
    lineHeight: "1.6",
  },

  tabContainer: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: "20px",
  },
  tabButton: {
    padding: "10px 30px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
  },
  messageList: {
    padding: "20px",
    backgroundColor: "#f4f4f9",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  cancelButton:{
    position: "absolute",
    top: "10px",
    right: "80px", // Move to top-right
    padding: "8px 12px",
    backgroundColor: "#D22B2B",
    color: "#fff",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",

  },
  editButton: {
    position: "absolute",
    top: "10px",
    right: "10px", // Move to top-right
    padding: "8px 12px",
    backgroundColor: "#D22B2B",
    color: "#fff",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  mainContent: {
    flex: 1,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', // Ensure alignment is centered if needed
    width: '100%', // Ensure the content area takes full available width
  },
  createGroupButton: {
    position: "absolute",
    top: "20px", // Place the button at the top of the page
    left: "40%",
    transform: "translateX(-50%)",
    padding: "25px 60px", // Triple padding for top/bottom, double padding for left/right
    backgroundColor: "#902bf5",
    color: "#fff",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: "20px",
    fontWeight: "bold",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    transition: "background-color 0.3s ease",
    marginBottom: '20px', // Add space below the button
  },
};

export default TeacherLandingPage;
