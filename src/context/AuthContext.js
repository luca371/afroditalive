import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);  // Firebase user
  const [salon, setSalon]     = useState(null);  // Firestore salon doc
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch salon data from Firestore
        const salonRef = doc(db, 'salons', firebaseUser.uid);
        const salonSnap = await getDoc(salonRef);
        setSalon(salonSnap.exists() ? { id: salonSnap.id, ...salonSnap.data() } : null);
      } else {
        setUser(null);
        setSalon(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  }

  async function register(email, password) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result;
  }

  async function logout() {
    await signOut(auth);
  }

  const value = { user, salon, setSalon, loading, login, register, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth trebuie folosit în interiorul AuthProvider');
  return context;
}