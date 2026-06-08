import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { Car, Users, Tag, ClipboardList, Plus, BarChart3 } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get('/reports/stats');
      setStats(res.data);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome to SwiftWheels Promotion & Marketing Subsystem</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <Link to="/vehicles" className="stat-card stat-vehicles">
          <div className="stat-icon"><Car size={28} /></div>
          <div className="stat-info">
            <h3>Total Vehicles</h3>
            <p className="stat-number">{stats?.totalVehicles || 0}</p>
            <span className="stat-sub">{stats?.activeVehicles || 0} available</span>
          </div>
        </Link>

        <Link to="/customers" className="stat-card stat-customers">
          <div className="stat-icon"><Users size={28} /></div>
          <div className="stat-info">
            <h3>Total Customers</h3>
            <p className="stat-number">{stats?.totalCustomers || 0}</p>
            <span className="stat-sub">{stats?.activeCustomers || 0} active</span>
          </div>
        </Link>

        <Link to="/promotions" className="stat-card stat-promotions">
          <div className="stat-icon"><Tag size={28} /></div>
          <div className="stat-info">
            <h3>Total Promotions</h3>
            <p className="stat-number">{stats?.totalPromotions || 0}</p>
            <span className="stat-sub">{stats?.activePromotions || 0} active</span>
          </div>
        </Link>

        <Link to="/report" className="stat-card stat-report">
          <div className="stat-icon"><ClipboardList size={28} /></div>
          <div className="stat-info">
            <h3>Report</h3>
            <p className="stat-number">View</p>
            <span className="stat-sub">Customer promotions</span>
          </div>
        </Link>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <Link to="/vehicles" className="action-card">
            <span className="action-icon"><Plus size={20} /></span>
            <span>Manage Vehicles</span>
          </Link>
          <Link to="/customers" className="action-card">
            <span className="action-icon"><Plus size={20} /></span>
            <span>Manage Customers</span>
          </Link>
          <Link to="/promotions" className="action-card">
            <span className="action-icon"><Plus size={20} /></span>
            <span>Manage Promotions</span>
          </Link>
          <Link to="/report" className="action-card">
            <span className="action-icon"><BarChart3 size={20} /></span>
            <span>View Report</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
