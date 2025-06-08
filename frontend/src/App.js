// frontend/src/App.js - 修復重複引入問題
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FollowProvider } from './context/FollowContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ModernTimelineHome from './pages/ModernTimelineHome';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import SearchPage from './pages/SearchPage';
import AdminPanel from './pages/AdminPanel';


// 保護路由組件
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-xl text-white">載入中...</div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <FollowProvider>
          <div className="App">
            <Routes>
              {/* 公開路由 */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* 保護路由 */}
              <Route path="/" element={
                <ProtectedRoute>
                  <ModernTimelineHome />
                </ProtectedRoute>
              } />
              
              <Route path="/profile/:userId?" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/search" element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              } />

              {/* 預設重導向 */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </FollowProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;