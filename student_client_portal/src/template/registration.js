import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"; // Firebase Auth for email/password
import { doc, setDoc } from "firebase/firestore";  // Import setDoc and doc

import { firestore } from '../firebase_setup/firebase'; // Your Firebase setup

const RegistrationForm = () => {
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age:'',
    phone:'',
    extraField: '' // Major, Company Name, or Subject
  });
  const history = useHistory();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Function to navigate to login screen
  const navigateToLogin = () => {
    history.push('/login');
  };

  const submitHandler = async (event) => {
    event.preventDefault();

    // Validate Passwords
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Determine user role and create user
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      const userDocRef = doc(firestore, "users", user.uid);

      // Save user information and role to Firestore
      await setDoc(userDocRef, {
        uid: user.uid,
        name: formData.name,
        age:formData.age,
        phone:formData.phone,
        email: formData.email,
        role: userType,
        extraField: formData.extraField,

      });

      alert(`User registered successfully as a ${userType}!`);
      history.push('/login'); // Redirect to login after successful registration
    } catch (error) {
      console.error("Error registering user: ", error);
      alert(error.message);
    }
  };

  // Render extra field based on user type
  const renderExtraField = () => {
    if (userType === 'student') {
      return (
        <div className="input-group">
          <label>Major</label>
          <input type="text" name="extraField" value={formData.extraField} onChange={handleChange} required />
        </div>
      );
    } else if (userType === 'client') {
      return (
        <div className="input-group">
          <label>Company Name</label>
          <input type="text" name="extraField" value={formData.extraField} onChange={handleChange} required />
        </div>
      );
    } else if (userType === 'teacher') {
      return (
        <div className="input-group">
          <label>Subject</label>
          <input type="text" name="extraField" value={formData.extraField} onChange={handleChange} required />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="form-container">
      <div className="form-header">Create Your Account</div>
      <form onSubmit={submitHandler}>
        <div className="input-group">
          <label>User Type</label>
          <select name="userType" value={userType} onChange={(e) => setUserType(e.target.value)} required>
            <option value="">Select User Type</option>
            <option value="client">Client</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>
        <div className="input-group">
          <label>Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>Age</label>
          <input type="number" name="age" value={formData.age} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>Phone</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>Retype Password</label>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
        </div>
        {renderExtraField()}
        <button type="submit" className="submit-button">Register</button>
      </form>
      <div className="bottom-text">
        Already have an account? <button onClick={navigateToLogin} style={{background: 'none', border: 'none', color: 'blue', cursor: 'pointer'}}>Sign in</button>
      </div>
    </div>
  );
};

export default RegistrationForm;
