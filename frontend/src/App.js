import { Routes, Route } from 'react-router-dom';
import Navbar          from './components/Navbar';
import Footer          from './components/Footer';
import ProtectedRoute  from './components/ProtectedRoute';
import HomePage        from './pages/HomePage';
import ListingPage     from './pages/ListingPage';
import DetailPage      from './pages/DetailPage';
import LoginPage            from './pages/LoginPage';
import RegisterPage         from './pages/RegisterPage';
import ForgotPasswordPage   from './pages/ForgotPasswordPage';
import ResetPasswordPage    from './pages/ResetPasswordPage';
import SavedPage            from './pages/SavedPage';
import ProfilePage          from './pages/ProfilePage';

function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          {/* Public */}
          <Route path="/"         element={<HomePage />} />
          <Route path="/login"            element={<LoginPage />} />
          <Route path="/register"         element={<RegisterPage />} />
          <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Protected */}
          <Route path="/projects"     element={<ProtectedRoute><ListingPage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><DetailPage /></ProtectedRoute>} />
          <Route path="/saved"        element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
          <Route path="/profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
