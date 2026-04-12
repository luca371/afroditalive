import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingScreen    from './screens/LandingScreen';
import LoginScreen      from './screens/LoginScreen';
import RegisterScreen   from './screens/RegisterScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import DashboardScreen  from './screens/DashboardScreen';
import BookingScreen    from './screens/BookingScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<LandingScreen />} />
        <Route path="/register"        element={<RegisterScreen />} />
        <Route path="/login"           element={<LoginScreen />} />
        <Route path="/book/:salonSlug" element={<BookingScreen />} />
        <Route path="/onboarding"      element={<OnboardingScreen />} />
        <Route path="/dashboard"       element={<DashboardScreen />} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}