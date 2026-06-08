import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import API from '../services/api';
import {
  LayoutDashboard, Car, Users, Tag, ClipboardList,
  Bell, LogOut, Zap, Info, CheckCircle,
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogoutClick = () => setShowLogoutConfirm(true);
  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    try { await API.post('/auth/logout'); } catch {}
    onLogout();
    navigate('/login');
  };
  const handleLogoutCancel = () => setShowLogoutConfirm(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getNotifIcon = (type) => {
    const icons = { info: Info, success: CheckCircle, warning: AlertTriangle, error: XCircle };
    const IconComp = icons[type] || Info;
    return <IconComp size={16} />;
  };

  return (
    <>
      {/* Sidebar — always visible */}
      <aside className="fixed top-0 left-0 bottom-0 w-[260px] bg-neutral-950 text-white flex flex-col z-[60] overflow-hidden">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 px-5 py-6 no-underline border-b border-white/10 flex-shrink-0">
          <span className="text-2xl flex-shrink-0"><Zap size={24} /></span>
          <span className="flex flex-col gap-0.5">
            <span className="font-bold text-base text-white leading-tight">SwiftWheels</span>
            <span className="text-xs text-white/40 uppercase tracking-[2px] font-medium">PMS</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="text-[0.65rem] font-semibold uppercase tracking-[1.2px] text-white/30 px-3 pb-2.5">Main Menu</div>
          {NAV_ITEMS.map((item) => {
            const IconComp = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 mb-0.5 no-underline text-white/65 rounded-lg text-sm font-medium transition-all hover:bg-white/10 hover:text-white ${
                  isActive(item.path) ? '!bg-white/10 !text-white' : ''
                }`}
              >
                <span className="w-6 flex-shrink-0 text-center"><IconComp size={18} /></span>
                <span className="flex-1">{item.label}</span>
                {isActive(item.path) && <span className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-white/10 p-3 flex-shrink-0">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/65 text-sm cursor-pointer font-inherit transition-all hover:bg-white/10 hover:text-white ${
                notifOpen ? 'bg-white/10 text-white' : 'bg-transparent'
              }`}
              onClick={() => setNotifOpen(!notifOpen)}
            >
              <span className="w-6 text-center relative flex-shrink-0">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-white text-black text-[0.6rem] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                    {unreadCount}
                  </span>
                )}
              </span>
              <span className="flex-1 text-left">Notifications</span>
            </button>

            {notifOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-300 rounded-xl shadow-lg z-50 max-h-[360px] overflow-hidden flex flex-col text-neutral-900">
                <div className="flex justify-between items-center px-4 py-3.5 border-b border-gray-200">
                  <h4 className="text-sm font-semibold">Notifications</h4>
                  {unreadCount > 0 && <span className="text-[0.7rem] text-gray-500 font-semibold">{unreadCount} new</span>}
                </div>
                <div className="overflow-y-auto max-h-[290px]">
                  {notifications.length === 0 ? (
                    <div className="text-center py-7 text-gray-400 text-sm">No notifications</div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div
                        key={n.NotificationID}
                        className={`flex gap-2.5 px-4 py-2.5 border-b border-gray-200 cursor-pointer transition-colors ${
                          !n.IsRead ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => { if (!n.IsRead) onMarkRead(n.NotificationID); }}
                      >
                        <span className="flex-shrink-0 mt-0.5">{getNotifIcon(n.Type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-900">{n.Title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-tight">{n.Message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User info */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg mt-1">
            <div className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-semibold text-white truncate">{user?.username}</span>
              <span className="text-[0.65rem] text-white/40 uppercase tracking-[0.6px] font-medium">{user?.role}</span>
            </div>
          </div>

          {/* Logout */}
          <button
            className="flex items-center gap-3 w-full px-3 py-2.5 mt-1 rounded-lg text-white/50 text-sm cursor-pointer font-inherit transition-all hover:bg-white/10 hover:text-white"
            onClick={handleLogoutClick}
          >
            <span className="w-6 text-center flex-shrink-0"><LogOut size={16} /></span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-8" onClick={handleLogoutCancel}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl px-6 py-7 w-full sm:max-w-[420px] shadow-[0_-8px_30px_rgba(0,0,0,0.15)] animate-[modalSlideUp_0.3s_ease-out] sm:animate-[modalFadeIn_0.2s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-3 text-black">Confirm Logout</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-2">Are you sure you want to logout from SwiftWheels PMS?</p>
            <p className="text-sm text-gray-400 mb-6">Logged in as: <strong className="text-gray-600">{user?.username}</strong></p>
            <div className="flex gap-2.5 justify-end">
              <button className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-md text-sm font-medium cursor-pointer transition-all min-h-[44px] bg-white text-neutral-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400" onClick={handleLogoutCancel}>Cancel</button>
              <button className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-md text-sm font-medium cursor-pointer transition-all min-h-[44px] bg-black text-white hover:bg-red-600 hover:shadow-[0_4px_12px_rgba(211,47,47,0.3)]" onClick={handleLogoutConfirm}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
