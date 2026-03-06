import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
