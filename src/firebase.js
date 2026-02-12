// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB78Ad0TsmsKplLjc7BiUzsKdBU-EhnP7c",
    authDomain: "volleyballscoringapp.firebaseapp.com",
    projectId: "volleyballscoringapp",
    storageBucket: "volleyballscoringapp.firebasestorage.app",
    messagingSenderId: "847656529256",
    appId: "1:847656529256:web:aa4cb45628ac7b1ed2fadd"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig); // ✅ ADD THIS
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
