import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import API from '../services/api';
import {
  LayoutDashboard, Car, Users, Tag, ClipboardList,
  Bell, LogOut, Menu, X, Zap, Info, CheckCircle,
  AlertTriangle, XCircle
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/vehicles', label: 'Vehicles', icon: Car },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/promotions', label: 'Promotions', icon: Tag },
  { path: '/report', label: 'Report', icon: ClipboardList },
];

function Sidebar({ user, onLogout, notifications, unreadCount, onMarkRead }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    try {
      await API.post('/auth/logout');
    } catch {
      // Even if logout request fails, clear local state
    }
    onLogout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getNotifIcon = (type) => {
    const icons = {
      info: Info,
      success: CheckCircle,
      warning: AlertTriangle,
      error: XCircle,
    };
    const IconComp = icons[type] || Info;
    return <IconComp size={16} />;
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Mobile toggle button */}
      <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Brand */}
        <Link to="/" className="sidebar-brand" onClick={closeSidebar}>
          <span className="sidebar-brand-icon"><Zap size={24} /></span>
          <span className="sidebar-brand-text">
            <span className="sidebar-brand-title">SwiftWheels</span>
            <span className="sidebar-brand-sub">PMS</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Main Menu</div>
          {NAV_ITEMS.map((item) => {
            const IconComp = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${isActive(item.path) ? 'sidebar-link-active' : ''}`}
                onClick={closeSidebar}
              >
                <span className="sidebar-link-icon"><IconComp size={18} /></span>
                <span className="sidebar-link-text">{item.label}</span>
                {isActive(item.path) && <span className="sidebar-link-indicator" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="sidebar-bottom">
          {/* Notifications */}
          <div className="sidebar-notif-wrapper" ref={notifRef}>
            <button
              className={`sidebar-notif-btn ${notifOpen ? 'sidebar-notif-btn-open' : ''}`}
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <span className="sidebar-notif-icon"><Bell size={18} /></span>
              {unreadCount > 0 && <span className="sidebar-notif-badge">{unreadCount}</span>}
              <span className="sidebar-notif-label">Notifications</span>
            </button>

            {notifOpen && (
              <div className="sidebar-notif-dropdown">
                <div className="sidebar-notif-header">
                  <h4>Notifications</h4>
                  {unreadCount > 0 && <span className="sidebar-notif-count">{unreadCount} new</span>}
                </div>
                <div className="sidebar-notif-list">
                  {notifications.length === 0 ? (
                    <div className="sidebar-notif-empty">No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div
                        key={n.NotificationID}
                        className={`sidebar-notif-item ${!n.IsRead ? 'sidebar-notif-unread' : ''}`}
                        onClick={() => {
                          if (!n.IsRead) onMarkRead(n.NotificationID);
                        }}
                      >
                        <span className="sidebar-notif-item-icon">{getNotifIcon(n.Type)}</span>
                        <div className="sidebar-notif-content">
                          <p className="sidebar-notif-title">{n.Title}</p>
                          <p className="sidebar-notif-message">{n.Message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User info */}
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.username}</span>
              <span className="sidebar-user-badge">{user?.role}</span>
            </div>
          </div>

          {/* Logout */}
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <span className="sidebar-logout-icon"><LogOut size={16} /></span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
