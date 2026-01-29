// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA4gKZuKBV8JhgEMdiLpSFj-JtXKRbFJg4",
    authDomain: "ai-counsellor-8127d.firebaseapp.com",
    projectId: "ai-counsellor-8127d",
    storageBucket: "ai-counsellor-8127d.firebasestorage.app",
    messagingSenderId: "368449114403",
    appId: "1:368449114403:web:9dbc5cabe1900576aabc96",
    measurementId: "G-5EEVG5C0YP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
