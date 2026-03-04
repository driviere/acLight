import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCOqWVqkpLv4jX7uFziWnEfgBpSQJxKM28",
    authDomain: "aclight-l33t.firebaseapp.com",
    projectId: "aclight-l33t",
    storageBucket: "aclight-l33t.firebasestorage.app",
    messagingSenderId: "201323145695",
    appId: "1:201323145695:web:d22411f05e38f1d9cbfc6a",
    measurementId: "G-YHRBMH3ZMB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
