// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCta4xQnJNclMW3XW9YNpmyhF0DGCGKjks",
  authDomain: "esp8266-85260.firebaseapp.com",
  databaseURL: "https://esp8266-85260-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esp8266-85260",
  storageBucket: "esp8266-85260.firebasestorage.app",
  messagingSenderId: "949106383083",
  appId: "1:949106383083:web:29e7204efd49499f5d46ae",
  measurementId: "G-6CNJT7RG69"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
