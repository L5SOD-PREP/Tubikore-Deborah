import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import API from './services/api';
import Sidebar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
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

  useEffect(() => { checkSession(); }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchNotifications, 30000);
    fetchNotifications();
    return () => clearInterval(interval);
  }, [user]);

  const checkSession = async () => {
    try {
      const res = await API.get('/auth/session');
      if (res.data.user) setUser(res.data.user);
    } catch (err) {
      const token = localStorage.getItem('pms_token');
      if (token) {
        try {
          const res = await API.post('/auth/verify-token');
          if (res.data.valid && res.data.user) setUser(res.data.user);
        } catch { localStorage.removeItem('pms_token'); }
      }
    } finally { setLoading(false); }
  };

  const fetchNotifications = async () => {
    try { const res = await API.get('/reports/notifications'); setNotifications(res.data || []); } catch {}
  };

  const handleLogin = (userData, token) => {
    setUser({ username: userData.username, role: userData.role });
    if (token) localStorage.setItem('pms_token', token);
  };

  const handleLogout = () => {
    setUser(null);
    setNotifications([]);
    localStorage.removeItem('pms_token');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-500">
        <div className="text-5xl animate-[spin_0.8s_linear_infinite]"><Zap size={36} /></div>
        <p className="text-sm">Loading SwiftWheels PMS...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.IsRead).length;

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <div className="flex min-h-screen flex-1">
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
          <main className={`flex-1 min-h-screen flex flex-col transition-all duration-250 ${user ? 'ml-[260px] w-[calc(100%-260px)]' : 'w-full'}`}>
            <Routes>
              <Route path="/" element={user ? <Dashboard /> : <Home />} />
              <Route path="/login" element={user ? <Dashboard /> : <Login onLogin={handleLogin} />} />
              <Route path="/register" element={user ? <Dashboard /> : <Register />} />
              <Route path="/dashboard" element={<ProtectedRoute user={user}><Dashboard /></ProtectedRoute>} />
              <Route path="/vehicles" element={<ProtectedRoute user={user}><Vehicles /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute user={user}><Customers /></ProtectedRoute>} />
              <Route path="/promotions" element={<ProtectedRoute user={user}><Promotions /></ProtectedRoute>} />
              <Route path="/promotions/:id/vehicles" element={<ProtectedRoute user={user}><PromotionVehicles /></ProtectedRoute>} />
              <Route path="/report" element={<ProtectedRoute user={user}><Report /></ProtectedRoute>} />
              <Route path="*" element={
                <div className="flex-1 flex flex-col p-4 pt-[72px] md:p-10 md:pt-10">
                  <div className="flex flex-col mb-5 gap-2">
                    <h1 className="text-2xl font-bold text-black">404 - Page Not Found</h1>
                    <p className="text-sm text-gray-500">The page you're looking for doesn't exist.</p>
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
