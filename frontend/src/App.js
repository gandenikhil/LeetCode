// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import SignupForm from './components/SignupForm';
import UserProfile from './components/userProfile';
import QuestionsPage from './components/QuestionsListing';
import Workspace from './components/workspace';
import { AuthProvider, useAuth } from './components/AuthContext';
import ProSubscription from './components/ProSubscription';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import "@fortawesome/fontawesome-free/css/all.min.css";
import './App.css';
import SuccessPage from './components/successPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (accessible only when not logged in)
const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/QuestionsPage" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes (redirect to QuestionsPage if logged in) */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <Navigate to="/login" replace />
          </PublicRoute>
        } 
      />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <SignupForm />
          </PublicRoute>
        } 
      />

      {/* Protected routes (redirect to login if not authenticated) */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/QuestionsPage" 
        element={
          <ProtectedRoute>
            <QuestionsPage />
          </ProtectedRoute>
        } 
      />
      <Route path="/subscription/success" element={<SuccessPage />} />

      <Route path="/workspace/:questionId" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />

      <Route 
        path="/pro" 
        element={
          <ProtectedRoute>
            <ProSubscription />
          </ProtectedRoute>
        } 
      />

      {/* 404 Route */}
      <Route 
        path="*" 
        element={
          <div className="d-flex justify-content-center align-items-center min-vh-100 flex-column">
            <h1 className="display-1">404</h1>
            <p className="lead">Page not found</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.history.back()}
            >
              Go Back
            </button>
          </div>
        } 
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;