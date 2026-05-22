import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyALuN4u3mT8WZXOH14rTv6O-OOT-tTPckA",
  authDomain: "gupshup-4f071.firebaseapp.com",
  projectId: "gupshup-4f071",
  storageBucket: "gupshup-4f071.firebasestorage.app",
  messagingSenderId: "1048460942825",
  appId: "1:1048460942825:web:66c1295771b34cd3783f78"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
