// App.jsx - FIXED
import { Routes, Route, Navigate } from 'react-router-dom';  // ← Removed BrowserRouter
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Configure from './pages/Configure';
import Results from './pages/Results';

function App() {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen">  {/* ← No Router wrapper */}
      {isAuthenticated && <Navbar />}
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        } />
        
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        
        <Route path="/configure/:fileId" element={
          <ProtectedRoute><Configure /></ProtectedRoute>
        } />
        
        <Route path="/results/:analysisId" element={
          <ProtectedRoute><Results /></ProtectedRoute>
        } />
        
        <Route path="*" element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        } />
      </Routes>
    </div>
  );
}

export default App;