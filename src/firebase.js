import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDQy32VH0aIgWYyE00qOQb_xdQdhRB2WbY",
  authDomain: "afroditalive-bc107.firebaseapp.com",
  projectId: "afroditalive-bc107",
  storageBucket: "afroditalive-bc107.firebasestorage.app",
  messagingSenderId: "962279748712",
  appId: "1:962279748712:web:058ad34a84d41cc8f337dd",
  measurementId: "G-R4S4EFCXPM",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);