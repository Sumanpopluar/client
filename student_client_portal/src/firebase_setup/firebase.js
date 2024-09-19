// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBtmrUgltvuB8cWaWSSJzB2wMby67naads",
  authDomain: "student-client-portal.firebaseapp.com",
  projectId: "student-client-portal",
  storageBucket: "student-client-portal.appspot.com",
  messagingSenderId: "858025311867",
  appId: "1:858025311867:web:c6d8b9c49a180211892cde",
  measurementId: "G-67CT61GKRP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage =getStorage(app);

export { firestore,storage};