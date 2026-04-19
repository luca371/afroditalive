import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import './LoginScreen.css';

export default function LoginScreen() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const [resetMode, setResetMode]       = useState(false);
  const [resetEmail, setResetEmail]     = useState('');
  const [resetSent, setResetSent]       = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(getFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSent(true);
    } catch (err) {
      setResetError(getFriendlyError(err.code));
    } finally {
      setResetLoading(false);
    }
  }

  if (resetMode) {
    return (
      <div className="auth-page">
        <div className="auth-glow" />
        <Link to="/" className="auth-logo">Afrodita</Link>
        <div className="auth-card">
          {resetSent ? (
            <>
              <div className="auth-reset-icon">✓</div>
              <div className="auth-card-label">Email trimis</div>
              <h1 className="auth-card-title">Verifică emailul</h1>
              <p className="auth-reset-note">
                Am trimis un link de resetare la <strong>{resetEmail}</strong>.
                Urmează instrucțiunile din email pentru a-ți seta o nouă parolă.
              </p>
              <button
                className="auth-btn"
                onClick={() => { setResetMode(false); setResetSent(false); setResetEmail(''); }}
              >
                Înapoi la autentificare
              </button>
            </>
          ) : (
            <>
              <div className="auth-card-label">Resetare parolă</div>
              <h1 className="auth-card-title">Ai uitat parola?</h1>
              <p className="auth-reset-note">
                Introdu emailul contului tău și îți trimitem un link pentru a seta o nouă parolă.
              </p>
              <form className="auth-form" onSubmit={handleReset}>
                <div className="auth-field">
                  <label>Email cont</label>
                  <input
                    type="email"
                    placeholder="salon@email.ro"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                {resetError && <div className="auth-error">{resetError}</div>}
                <button className="auth-btn" type="submit" disabled={resetLoading}>
                  {resetLoading ? 'Se trimite...' : 'Trimite link de resetare'}
                </button>
              </form>
              <button
                className="auth-back-link"
                onClick={() => { setResetMode(false); setResetError(''); }}
              >
                ← Înapoi la autentificare
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <Link to="/" className="auth-logo">Afrodita</Link>
      <div className="auth-card">
        <div className="auth-card-label">Bine ai revenit</div>
        <h1 className="auth-card-title">Intră în cont</h1>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="salon@email.ro"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label>
              Parolă
              <button
                type="button"
                className="auth-forgot"
                onClick={() => { setResetMode(true); setResetEmail(email); }}
              >
                Ai uitat parola?
              </button>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Se încarcă...' : 'Intră în cont'}
          </button>
        </form>
        <div className="auth-footer">
          Nu ai cont?{' '}
          <Link to="/register">Creează unul gratuit</Link>
        </div>
      </div>
    </div>
  );
}

function getFriendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email sau parolă incorectă.';
    case 'auth/too-many-requests':
      return 'Prea multe încercări. Încearcă din nou mai târziu.';
    case 'auth/invalid-email':
      return 'Adresa de email nu este validă.';
    default:
      return 'A apărut o eroare. Încearcă din nou.';
  }
}