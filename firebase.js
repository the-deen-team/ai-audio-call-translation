import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDULkmrXgOu3YpcjSc_1q6AMrAONCjvG5s",
  authDomain: "ai-audio-call-translation.firebaseapp.com",
  projectId: "ai-audio-call-translation",
  storageBucket: "ai-audio-call-translation.appspot.com",
  messagingSenderId: "524522688875",
  appId: "1:524522688875:web:ea82a615c280ff98a4fc2e",
  measurementId: "G-NLKRJHSGEF"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export { firestore }
