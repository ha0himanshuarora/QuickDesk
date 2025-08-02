// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "helpdeck-qgy3e",
  "appId": "1:583536869895:web:0f13da120e4ee518b020a2",
  "storageBucket": "helpdeck-qgy3e.appspot.com",
  "apiKey": "AIzaSyBtizN7dyeaFeYYqxsQhIRme79Zz1XgFjY",
  "authDomain": "helpdeck-qgy3e.firebaseapp.com",
  "messagingSenderId": "583536869895"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;


export { app, auth, db, storage, analytics };
