import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { Car, Users, Tag, ClipboardList, Plus, BarChart3 } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try { const res = await API.get('/reports/stats'); setStats(res.data); }
    catch { setError('Failed to load dashboard data'); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="text-center py-12 text-sm text-gray-500">Loading dashboard...</div>;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-7 lg:p-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-5 md:mb-6 gap-2">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-[1.65rem] font-bold text-black tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome to SwiftWheels Promotion & Marketing Subsystem</p>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg mb-4 text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">{error}</div>}

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-5 mb-7">
        <Link to="/vehicles" className="bg-white rounded-xl p-[18px] md:p-[22px] flex items-center gap-3.5 no-underline text-neutral-900 shadow-sm border border-gray-200 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300 active:scale-[0.98] active:bg-gray-50">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 flex-shrink-0"><Car size={28} /></div>
          <div>
            <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-[0.3px] mb-0.5">Total Vehicles</h3>
            <p className="text-2xl md:text-[1.65rem] font-bold text-neutral-950 leading-tight tracking-tight">{stats?.totalVehicles || 0}</p>
            <span className="text-xs text-gray-400">{stats?.activeVehicles || 0} available</span>
          </div>
        </Link>

        <Link to="/customers" className="bg-white rounded-xl p-[18px] md:p-[22px] flex items-center gap-3.5 no-underline text-neutral-900 shadow-sm border border-gray-200 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300 active:scale-[0.98] active:bg-gray-50">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 flex-shrink-0"><Users size={28} /></div>
          <div>
            <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-[0.3px] mb-0.5">Total Customers</h3>
            <p className="text-2xl md:text-[1.65rem] font-bold text-neutral-950 leading-tight tracking-tight">{stats?.totalCustomers || 0}</p>
            <span className="text-xs text-gray-400">{stats?.activeCustomers || 0} active</span>
          </div>
        </Link>

        <Link to="/promotions" className="bg-white rounded-xl p-[18px] md:p-[22px] flex items-center gap-3.5 no-underline text-neutral-900 shadow-sm border border-gray-200 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300 active:scale-[0.98] active:bg-gray-50">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 flex-shrink-0"><Tag size={28} /></div>
          <div>
            <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-[0.3px] mb-0.5">Total Promotions</h3>
            <p className="text-2xl md:text-[1.65rem] font-bold text-neutral-950 leading-tight tracking-tight">{stats?.totalPromotions || 0}</p>
            <span className="text-xs text-gray-400">{stats?.activePromotions || 0} active</span>
          </div>
        </Link>

        <Link to="/report" className="bg-white rounded-xl p-[18px] md:p-[22px] flex items-center gap-3.5 no-underline text-neutral-900 shadow-sm border border-gray-200 transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300 active:scale-[0.98] active:bg-gray-50">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 flex-shrink-0"><ClipboardList size={28} /></div>
          <div>
            <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-[0.3px] mb-0.5">Report</h3>
            <p className="text-2xl md:text-[1.65rem] font-bold text-neutral-950 leading-tight tracking-tight">View</p>
            <span className="text-xs text-gray-400">Customer promotions</span>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="mt-1">
        <h2 className="text-base font-semibold mb-3 text-neutral-900">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
          <Link to="/vehicles" className="flex flex-col items-center justify-center gap-2 p-4 md:py-4 bg-white border border-gray-200 rounded-lg no-underline text-neutral-900 font-medium text-xs md:text-sm text-center min-h-[80px] transition-all hover:bg-black hover:text-white hover:border-black hover:-translate-y-0.5 hover:shadow-md active:scale-[0.96] active:bg-gray-50">
            <span><Plus size={20} /></span>
            <span>Manage Vehicles</span>
          </Link>
          <Link to="/customers" className="flex flex-col items-center justify-center gap-2 p-4 md:py-4 bg-white border border-gray-200 rounded-lg no-underline text-neutral-900 font-medium text-xs md:text-sm text-center min-h-[80px] transition-all hover:bg-black hover:text-white hover:border-black hover:-translate-y-0.5 hover:shadow-md active:scale-[0.96] active:bg-gray-50">
            <span><Plus size={20} /></span>
            <span>Manage Customers</span>
          </Link>
          <Link to="/promotions" className="flex flex-col items-center justify-center gap-2 p-4 md:py-4 bg-white border border-gray-200 rounded-lg no-underline text-neutral-900 font-medium text-xs md:text-sm text-center min-h-[80px] transition-all hover:bg-black hover:text-white hover:border-black hover:-translate-y-0.5 hover:shadow-md active:scale-[0.96] active:bg-gray-50">
            <span><Plus size={20} /></span>
            <span>Manage Promotions</span>
          </Link>
          <Link to="/report" className="flex flex-col items-center justify-center gap-2 p-4 md:py-4 bg-white border border-gray-200 rounded-lg no-underline text-neutral-900 font-medium text-xs md:text-sm text-center min-h-[80px] transition-all hover:bg-black hover:text-white hover:border-black hover:-translate-y-0.5 hover:shadow-md active:scale-[0.96] active:bg-gray-50">
            <span><BarChart3 size={20} /></span>
            <span>View Report</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
