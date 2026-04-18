import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingScreen       from './screens/LandingScreen';
import LoginScreen         from './screens/LoginScreen';
import RegisterScreen      from './screens/RegisterScreen';
import OnboardingScreen    from './screens/OnboardingScreen';
import DashboardScreen     from './screens/DashboardScreen';
import BookingScreen       from './screens/BookingScreen';
import CancelBookingScreen from './screens/CancelBookingScreen';
import ProtectedRoute      from './components/ProtectedRoute';
import PublicRoute         from './components/PublicRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"                    element={<LandingScreen />} />
        <Route path="/book/:salonSlug"     element={<BookingScreen />} />
        <Route path="/cancel/:bookingId"   element={<CancelBookingScreen />} />

        {/* Doar pentru neautentificați */}
        <Route path="/login" element={
          <PublicRoute><LoginScreen /></PublicRoute>
        }/>
        <Route path="/register" element={
          <PublicRoute><RegisterScreen /></PublicRoute>
        }/>

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