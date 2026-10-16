import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCCnAhTDVC9lipV_PoU2RCmUSXAFCOPoSE",
    authDomain: "smarlist-9ddee.firebaseapp.com",
    projectId: "smarlist-9ddee",
    storageBucket: "smarlist-9ddee.firebasestorage.app",
    messagingSenderId: "847570047834",
    appId: "1:847570047834:web:c9616ef793a572ce1e9963"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export const APP_ID = "smarlist-9ddee"; // Used for paths
export { app, auth, db };
