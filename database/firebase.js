// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDXfmZhSLgiz4Oj4jMWwCgzFt_Sldegpuc",
  authDomain: "skin-girl-lab.firebaseapp.com",
  projectId: "skin-girl-lab",
  storageBucket: "skin-girl-lab.firebasestorage.app",
  messagingSenderId: "640828362478",
  appId: "1:640828362478:web:e3c0cfa4f042ff0c866dff"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = db;