import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import API from './services/api';
import Sidebar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Customers from './pages/Customers';
import Promotions from './pages/Promotions';
import PromotionVehicles from './pages/PromotionVehicles';
import Report from './pages/Report';
import { Zap } from 'lucide-react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    checkSession();
  }, []);

  // Poll for notifications when user is logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications();
    return () => clearInterval(interval);
  }, [user]);

  const checkSession = async () => {
    try {
      const res = await API.get('/auth/session');
      if (res.data.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      // Session check failed, try JWT token
      const token = localStorage.getItem('pms_token');
      if (token) {
        try {
          const res = await API.post('/auth/verify-token');
          if (res.data.valid && res.data.user) {
            setUser(res.data.user);
          }
        } catch {
          localStorage.removeItem('pms_token');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/reports/notifications');
      setNotifications(res.data || []);
    } catch {
      // Silently fail
    }
  };

  const handleLogin = (userData, token) => {
    setUser({ username: userData.username, role: userData.role });
    if (token) {
      localStorage.setItem('pms_token', token);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setNotifications([]);
    localStorage.removeItem('pms_token');
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"><Zap size={36} /></div>
        <p>Loading SwiftWheels PMS...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.IsRead).length;

  return (
    <Router>
      <div className="app">
        <div className="app-layout">
          {user && (
            <Sidebar
              user={user}
              setUser={setUser}
              onLogout={handleLogout}
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkRead={async (id) => {
                await API.put(`/reports/notifications/${id}/read`);
                fetchNotifications();
              }}
            />
          )}
          <main className={user ? 'main-content' : 'main-content-full'}>
          <Routes>
            <Route path="/login" element={
              user ? <Dashboard /> : <Login onLogin={handleLogin} />
            } />
            <Route path="/" element={
              <ProtectedRoute user={user}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/vehicles" element={
              <ProtectedRoute user={user}>
                <Vehicles />
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute user={user}>
                <Customers />
              </ProtectedRoute>
            } />
            <Route path="/promotions" element={
              <ProtectedRoute user={user}>
                <Promotions />
              </ProtectedRoute>
            } />
            <Route path="/promotions/:id/vehicles" element={
              <ProtectedRoute user={user}>
                <PromotionVehicles />
              </ProtectedRoute>
            } />
            <Route path="/report" element={
              <ProtectedRoute user={user}>
                <Report />
              </ProtectedRoute>
            } />
            <Route path="*" element={
              <div className="page-container">
                <div className="page-header">
                  <h1>404 - Page Not Found</h1>
                  <p>The page you're looking for doesn't exist.</p>
                </div>
              </div>
            } />
          </Routes>
        </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
