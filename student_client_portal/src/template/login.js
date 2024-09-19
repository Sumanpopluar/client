import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {collection, query, where, getDocs} from 'firebase/firestore';
import { firestore } from '../firebase_setup/firebase'; // Your Firestore setup

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const history = useHistory();

  const handleLogin = async (event) => {
    event.preventDefault();
    const auth = getAuth();
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Create a query against the 'users' collection where the 'uid' field matches the logged-in user's UID
      const usersQuery = query(collection(firestore, 'users'), where('uid', '==', user.uid));
      const querySnapshot = await getDocs(usersQuery);
  
      if (!querySnapshot.empty) {
        // Assuming the UID is unique, there should only be one matching document
        const userData = querySnapshot.docs[0].data();
        console.log('User data:', userData);
  
        // Redirect based on user role
        const userRole = userData.role;
        history.push('/' + userRole); // This assumes you have routes set up for each role
      } else {
        console.log('No user document matches the provided UID.');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert(error.message);
    }
  };
  

  const navigateToRegister = () => {
    history.push('/register');
  };

  return (
    <div className='login-background'>
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button">
          Login
        </button>
        <button
          type="button"
          className="create-account-button"
          onClick={navigateToRegister}
        >
          Create Account
        </button>
      </form>
    </div>
    </div>
  );
};

export default LoginForm;
