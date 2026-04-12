import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import './LoginScreen.css';

export default function RegisterScreen() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [salonName, setSalonName] = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { user } = await register(email, password);

      // Creează documentul salonului în Firestore
      await setDoc(doc(db, 'salons', user.uid), {
        name: salonName.trim(),
        email: email.trim(),
        slug: slugify(salonName),
        plan: 'free',
        onboardingComplete: false,
        createdAt: new Date().toISOString(),
      });

      navigate('/onboarding');
    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-glow" />

      <Link to="/" className="auth-logo">Afrodita</Link>

      <div className="auth-card">
        <div className="auth-card-label">Începe gratuit</div>
        <h1 className="auth-card-title">Creează contul salonului</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Numele salonului</label>
            <input
              type="text"
              placeholder="ex. Studio Lumière"
              value={salonName}
              onChange={e => setSalonName(e.target.value)}
              required
              autoFocus
              maxLength={60}
            />
          </div>

          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="salon@email.ro"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label>Parolă</label>
            <input
              type="password"
              placeholder="Minim 6 caractere"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Se creează contul...' : 'Creează contul gratuit'}
          </button>
        </form>

        <div className="auth-footer">
          Ai deja cont?{' '}
          <Link to="/login">Intră în cont</Link>
        </div>
      </div>
    </div>
  );
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getFriendlyError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Există deja un cont cu acest email.';
    case 'auth/invalid-email':
      return 'Adresa de email nu este validă.';
    case 'auth/weak-password':
      return 'Parola trebuie să aibă cel puțin 6 caractere.';
    default:
      return 'A apărut o eroare. Încearcă din nou.';
  }
}