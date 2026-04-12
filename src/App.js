import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingScreen    from './screens/LandingScreen';
import LoginScreen      from './screens/LoginScreen';
import RegisterScreen   from './screens/RegisterScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import DashboardScreen  from './screens/DashboardScreen';
import BookingScreen    from './screens/BookingScreen';
import ProtectedRoute   from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"                element={<LandingScreen />} />
        <Route path="/register"        element={<RegisterScreen />} />
        <Route path="/login"           element={<LoginScreen />} />
        <Route path="/book/:salonSlug" element={<BookingScreen />} />

        {/* Protejate */}
        <Route path="/onboarding" element={
          <ProtectedRoute><OnboardingScreen /></ProtectedRoute>
        }/>
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardScreen /></ProtectedRoute>
        }/>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}