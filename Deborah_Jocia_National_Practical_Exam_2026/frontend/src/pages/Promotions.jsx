import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { Tag, Search, X, Pencil, Trash2, ArrowLeft, ArrowRight, Car } from 'lucide-react';

const DISCOUNT_TYPES = ['free', 'percentage', 'FLAT_RATE', 'CASHBACK', 'BUY_ONE_GET_ONE', 'Bundle', 'amount'];
const PROMO_TITLES = ['New Year sale', 'Holiday Price Slash', 'Weekend Flash Sale', 'Clearance Discount Offer', 'Seasonal Price Drop'];

function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    Title: '', Description: '', Discount_Type: '', Discount_Value: '',
    Start_Date: '', End_Date: '', Status: 'Active'
  });

  useEffect(() => { fetchPromotions(); }, []);

  const fetchPromotions = async (searchTerm = '', page = 1) => {
    try {
      let url = `/promotions?page=${page}&limit=20`;
      if (searchTerm) url += `&search=${searchTerm}`;
      const res = await API.get(url);
      setPromotions(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      setError('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPromotions(search, 1);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ Title: '', Description: '', Discount_Type: '', Discount_Value: '', Start_Date: '', End_Date: '', Status: 'Active' });
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const quickFill = (title) => {
    setForm({ ...form, Title: title });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await API.put(`/promotions/${editing.PromotionID}`, form);
      } else {
        await API.post('/promotions', form);
      }
      resetForm();
      fetchPromotions(search, pagination.page);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Operation failed');
    }
  };

  const handleEdit = (promo) => {
    setForm({
      Title: promo.Title,
      Description: promo.Description || '',
      Discount_Type: promo.Discount_Type,
      Discount_Value: promo.Discount_Value,
      Start_Date: promo.Start_Date?.slice(0, 10) || '',
      End_Date: promo.End_Date?.slice(0, 10) || '',
      Status: promo.Status
    });
    setEditing(promo);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;
    try {
      await API.delete(`/promotions/${id}`);
      fetchPromotions(search, pagination.page);
    } catch (err) {
      setError('Failed to delete promotion');
    }
  };

  const getDiscountTypeLabel = (type) => {
    const labels = {
      'free': 'Free',
      'percentage': 'Percentage (%)',
      'FLAT_RATE': 'Flat Rate ($)',
      'CASHBACK': 'Cashback',
      'BUY_ONE_GET_ONE': 'BOGO',
      'Bundle': 'Bundle',
      'amount': 'Amount ($)'
    };
    return labels[type] || type;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><Tag size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Promotions Management</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? <><X size={14} style={{ marginRight: '4px' }} /> Cancel</> : '+ Add Promotion'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h3>{editing ? 'Edit Promotion' : 'Add New Promotion'}</h3>
          <div className="quick-fill">
            <label>Quick Title Select:</label>
            <div className="pill-group">
              {PROMO_TITLES.map(t => (
                <button key={t} type="button" className={`pill ${form.Title === t ? 'active' : ''}`}
                  onClick={() => quickFill(t)}>{t}</button>
              ))}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Title *</label>
              <input name="Title" value={form.Title} onChange={handleChange} placeholder="Promotion title" required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="Description" value={form.Description} onChange={handleChange}
                placeholder="Promotion description..." rows="3" />
            </div>
            <div className="form-group">
              <label>Discount Type *</label>
              <select name="Discount_Type" value={form.Discount_Type} onChange={handleChange} required>
                <option value="">Select type</option>
                {DISCOUNT_TYPES.map(dt => (
                  <option key={dt} value={dt}>{getDiscountTypeLabel(dt)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Discount Value *</label>
              <input name="Discount_Value" type="number" step="0.01" value={form.Discount_Value}
                onChange={handleChange} placeholder="e.g. 10 or 15.99" required />
            </div>
            <div className="form-group">
              <label>Start Date *</label>
              <input name="Start_Date" type="date" value={form.Start_Date} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input name="End_Date" type="date" value={form.End_Date} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="Status" value={form.Status} onChange={handleChange}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editing ? 'Update Promotion' : 'Add Promotion'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <form onSubmit={handleSearch} className="search-bar">
        <input type="text" placeholder="Search by title, description, or discount type..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="btn btn-primary"><Search size={14} style={{ marginRight: '4px' }} /> Search</button>
        {search && <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); fetchPromotions('', 1); }}><X size={14} style={{ marginRight: '4px' }} /> Clear</button>}
      </form>

      {loading ? <div className="loading">Loading promotions...</div> : (
        <>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Discount Type</th>
                  <th>Value</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.length === 0 ? (
                  <tr><td colSpan="8" className="empty-table">No promotions found</td></tr>
                ) : promotions.map(p => (
                  <tr key={p.PromotionID}>
                    <td>{p.PromotionID}</td>
                    <td><strong>{p.Title}</strong></td>
                    <td><span className="badge">{getDiscountTypeLabel(p.Discount_Type)}</span></td>
                    <td>{p.Discount_Value}{p.Discount_Type === 'percentage' ? '%' : ''}</td>
                    <td>{p.Start_Date}</td>
                    <td>{p.End_Date}</td>
                    <td><span className={`status-badge status-${p.Status?.toLowerCase()}`}>{p.Status}</span></td>
                    <td className="action-btns">
                      <Link to={`/promotions/${p.PromotionID}/vehicles`} className="btn btn-sm btn-link" title="Link Vehicles"><Car size={14} /></Link>
                      <button className="btn btn-sm btn-edit" onClick={() => handleEdit(p)} title="Edit"><Pencil size={14} /></button>
                      <button className="btn btn-sm btn-delete" onClick={() => handleDelete(p.PromotionID)} title="Delete"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-sm" disabled={pagination.page <= 1}
                onClick={() => fetchPromotions(search, pagination.page - 1)}><ArrowLeft size={14} style={{ marginRight: '4px' }} /> Previous</button>
              <span className="page-info">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
              <button className="btn btn-sm" disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchPromotions(search, pagination.page + 1)}>Next <ArrowRight size={14} style={{ marginLeft: '4px' }} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Promotions;
