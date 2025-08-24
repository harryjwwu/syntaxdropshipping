import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import LoadingSpinner from './components/LoadingSpinner';
import DashboardLayout from './components/DashboardLayout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ServicesPage from './pages/ServicesPage';
import ContactPage from './pages/ContactPage';
import ProfilePage from './pages/ProfilePage';


// Dashboard Pages
import DashboardPage from './pages/DashboardPage';
import AffiliatePage from './pages/AffiliatePage';
import QuotesPage from './pages/QuotesPage';
import OrdersPage from './pages/OrdersPage';
import DepositPage from './pages/DepositPage';

// Context
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Utils
import { authAPI } from './utils/api';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Initialize app - check for existing auth token
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await authAPI.verifyToken();
          setUser(response.user);
        }
      } catch (error) {
        // Token is invalid, remove it
        localStorage.removeItem('token');
        console.log('Token verification failed:', error.message);
      } finally {
        setTimeout(() => setIsLoading(false), 800); // Smooth loading transition
      }
    };

    initializeApp();
  }, []);

  // Show loading spinner while initializing
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <LanguageProvider>
      <AuthProvider initialUser={user}>
        <Router>
        <div className="App min-h-screen bg-gray-50">
          {/* Toast notifications */}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          {/* Scroll to top component */}
          <ScrollToTop />
          
          {/* Main content */}
          <main className="min-h-screen">
            <Routes>
              {/* Public routes with traditional layout */}
              <Route path="/" element={
                <>
                  <Navbar />
                  <HomePage />
                  <Footer />
                </>
              } />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/services" element={
                <>
                  <Navbar />
                  <ServicesPage />
                  <Footer />
                </>
              } />
              <Route path="/contact" element={
                <>
                  <Navbar />
                  <ContactPage />
                  <Footer />
                </>
              } />

              {/* Dashboard routes with new layout */}
              <Route path="/dashboard" element={
                <DashboardLayout>
                  <DashboardPage />
                </DashboardLayout>
              } />
              <Route path="/affiliate" element={
                <DashboardLayout>
                  <AffiliatePage />
                </DashboardLayout>
              } />
              <Route path="/quotes" element={
                <DashboardLayout>
                  <QuotesPage />
                </DashboardLayout>
              } />
              <Route path="/orders" element={
                <DashboardLayout>
                  <OrdersPage />
                </DashboardLayout>
              } />
              <Route path="/deposit" element={
                <DashboardLayout>
                  <DepositPage />
                </DashboardLayout>
              } />

              <Route path="/profile" element={
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              } />

              {/* Redirect legacy commission route to affiliate */}
              <Route path="/commission" element={<Navigate to="/affiliate" replace />} />
            </Routes>
          </main>
        </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;