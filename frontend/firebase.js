import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

// Firebase configuration (PLACEHOLDER for security)
const firebaseConfig = {
    apiKey: "PLACEHOLDER",
    authDomain: "PLACEHOLDER",
    projectId: "PLACEHOLDER",
    storageBucket: "PLACEHOLDER",
    messagingSenderId: "PLACEHOLDER",
    appId: "PLACEHOLDER"
};

const app = initializeApp(firebaseConfig);
const aith = getAuth(app);

export { auth, signInWithEmailAndPassword, signOut };
