import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: '#1a0e09',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'DM Sans, sans-serif',
      color: 'rgba(250,247,242,0.3)',
      fontSize: '14px',
      letterSpacing: '0.1em',
    }}>
      Se încarcă...
    </div>
  );

  if (user) return <Navigate to="/dashboard" replace />;

  return children;
}