import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import DepositsPage from './pages/DepositsPage';
import UsersPage from './pages/UsersPage';
import UserDetailPage from './pages/UserDetailPage';
import SettingsPage from './pages/SettingsPage';
import SPUPage from './pages/SPUPage';
import SPUDetailPage from './pages/SPUDetailPage';
import SPUFormPage from './pages/SPUFormPage';
import SPUQuotesPage from './pages/SPUQuotesPage';
import SPUQuoteFormPage from './pages/SPUQuoteFormPage';
import SPUPriceHistoryPage from './pages/SPUPriceHistoryPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* 登录页面 */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* 管理员页面 */}
            <Route path="/" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="spus" element={<SPUPage />} />
              <Route path="spus/new" element={<SPUFormPage />} />
              <Route path="spus/:spu" element={<SPUDetailPage />} />
              <Route path="spus/:spu/edit" element={<SPUFormPage />} />
              <Route path="spu-quotes" element={<SPUQuotesPage />} />
              <Route path="spu-quotes/new" element={<SPUQuoteFormPage />} />
              <Route path="spu-quotes/:id/edit" element={<SPUQuoteFormPage />} />
              <Route path="spu-price-history" element={<SPUPriceHistoryPage />} />
              <Route path="deposits" element={<DepositsPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="users/:id" element={<UserDetailPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            
            {/* 默认重定向 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          
          {/* Toast 通知 */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
