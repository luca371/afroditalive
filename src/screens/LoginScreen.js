import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginScreen.css';

export default function LoginScreen() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

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
            <label>Parolă</label>
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