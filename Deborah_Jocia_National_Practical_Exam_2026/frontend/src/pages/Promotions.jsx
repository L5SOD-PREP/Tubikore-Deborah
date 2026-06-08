import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { Tag, Search, X, Pencil, Trash2, ArrowLeft, ArrowRight, Car } from 'lucide-react';
import { validatePromotion } from '../utils/validation';

const DISCOUNT_TYPES = ['free', 'percentage', 'FLAT_RATE', 'CASHBACK', 'BUY_ONE_GET_ONE', 'Bundle', 'amount'];
const PROMO_TITLES = ['New Year sale', 'Holiday Price Slash', 'Weekend Flash Sale', 'Clearance Discount Offer', 'Seasonal Price Drop'];

function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    Title: '', Description: '', Discount_Type: '', Discount_Value: '',
    Start_Date: '', End_Date: '', Status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});
  const debounceRef = useRef(null);

  // Get today's date in YYYY-MM-DD for the min attribute
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchPromotions = useCallback(async (searchTerm = '', status = '', type = '', page = 1) => {
    try {
      let url = `/promotions?page=${page}&limit=20`;
      if (searchTerm) url += `&search=${searchTerm}`;
      const res = await API.get(url);
      let data = res.data.data || [];
      if (status) data = data.filter(p => p.Status === status);
      if (type) data = data.filter(p => p.Discount_Type === type);
      setPromotions(data);
      setPagination(res.data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      setError('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPromotions(value, statusFilter, typeFilter, 1);
    }, 350);
  };

  const handleStatusFilter = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    fetchPromotions(search, value, typeFilter, 1);
  };

  const handleTypeFilter = (e) => {
    const value = e.target.value;
    setTypeFilter(value);
    fetchPromotions(search, statusFilter, value, 1);
  };

  const clearSearch = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    fetchPromotions('', '', '', 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
    }
    if (name === 'Start_Date' && form.End_Date && formErrors.End_Date) {
      setFormErrors(prev => { const u = { ...prev }; delete u.End_Date; return u; });
    }
  };

  const resetForm = () => {
    setForm({ Title: '', Description: '', Discount_Type: '', Discount_Value: '', Start_Date: '', End_Date: '', Status: 'Active' });
    setFormErrors({}); setEditing(null); setShowForm(false); setError('');
  };

  const quickFill = (title) => {
    setForm(prev => ({ ...prev, Title: title }));
    if (formErrors.Title) setFormErrors(prev => { const u = { ...prev }; delete u.Title; return u; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setFormErrors({});
    const { valid, errors } = validatePromotion(form);
    if (!valid) { setFormErrors(errors); return; }
    try {
      if (editing) await API.put(`/promotions/${editing.PromotionID}`, form);
      else await API.post('/promotions', form);
      resetForm();
      fetchPromotions(search, statusFilter, typeFilter, pagination.page);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Operation failed');
    }
  };

  const handleEdit = (promo) => {
    setForm({
      Title: promo.Title, Description: promo.Description || '',
      Discount_Type: promo.Discount_Type, Discount_Value: promo.Discount_Value,
      Start_Date: promo.Start_Date?.slice(0, 10) || '',
      End_Date: promo.End_Date?.slice(0, 10) || '', Status: promo.Status
    });
    setFormErrors({}); setEditing(promo); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;
    try { await API.delete(`/promotions/${id}`); fetchPromotions(search, statusFilter, typeFilter, pagination.page); }
    catch { setError('Failed to delete promotion'); }
  };

  const getDiscountTypeLabel = (type) => {
    const labels = {
      'free': 'Free', 'percentage': 'Percentage (%)', 'FLAT_RATE': 'Flat Rate ($)',
      'CASHBACK': 'Cashback', 'BUY_ONE_GET_ONE': 'BOGO', 'Bundle': 'Bundle', 'amount': 'Amount ($)'
    };
    return labels[type] || type;
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-7 lg:p-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-5 gap-2">
        <h1 className="text-xl md:text-lg lg:text-2xl font-bold text-black flex items-center gap-2">
          <Tag size={24} /> Promotions Management
        </h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-md text-sm font-medium cursor-pointer transition-all min-h-[44px] bg-black text-white hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0">
            {showForm ? <><X size={14} /> Cancel</> : '+ Add Promotion'}
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg mb-4 text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-xl p-5 mb-5 shadow-sm border border-gray-200">
          <h3 className="mb-4 text-base font-semibold text-neutral-900">{editing ? 'Edit Promotion' : 'Add New Promotion'}</h3>
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px] mb-2 block">Quick Title Select:</label>
            <div className="flex flex-wrap gap-2">
              {PROMO_TITLES.map(t => (
                <button key={t} type="button"
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                    form.Title === t
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-black hover:text-black'
                  }`}
                  onClick={() => quickFill(t)}
                >{t}</button>
              ))}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5" noValidate>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Title *</label>
              <input name="Title" value={form.Title} onChange={handleChange} placeholder="Promotion title" required
                className={`p-3 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400 ${formErrors.Title ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`} />
              {formErrors.Title && <span className="text-xs text-red-600 font-medium">{formErrors.Title}</span>}
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Description</label>
              <textarea name="Description" value={form.Description} onChange={handleChange}
                placeholder="Promotion description..." rows="3"
                className="p-3 text-base border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400 resize-vertical" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Discount Type *</label>
              <select name="Discount_Type" value={form.Discount_Type} onChange={handleChange} required
                className={`p-3 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 min-h-[44px] appearance-none ${formErrors.Discount_Type ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`}>
                <option value="">Select type</option>
                {DISCOUNT_TYPES.map(dt => (
                  <option key={dt} value={dt}>{getDiscountTypeLabel(dt)}</option>
                ))}
              </select>
              {formErrors.Discount_Type && <span className="text-xs text-red-600 font-medium">{formErrors.Discount_Type}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Discount Value *</label>
              <input name="Discount_Value" type="number" step="0.01" value={form.Discount_Value}
                onChange={handleChange} placeholder="e.g. 10 or 15.99" required
                className={`p-3 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400 ${formErrors.Discount_Value ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`} />
              {formErrors.Discount_Value && <span className="text-xs text-red-600 font-medium">{formErrors.Discount_Value}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Start Date *</label>
              <input name="Start_Date" type="date" value={form.Start_Date} onChange={handleChange} required
                min={!editing ? todayStr : undefined}
                className={`p-3 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 ${formErrors.Start_Date ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`} />
              {formErrors.Start_Date && <span className="text-xs text-red-600 font-medium">{formErrors.Start_Date}</span>}
              {!formErrors.Start_Date && form.Start_Date && !editing && (
                <span className="text-xs font-medium text-gray-400">Must be today or later</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">End Date *</label>
              <input name="End_Date" type="date" value={form.End_Date} onChange={handleChange} required
                min={form.Start_Date || todayStr}
                className={`p-3 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 ${formErrors.End_Date ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`} />
              {formErrors.End_Date && <span className="text-xs text-red-600 font-medium">{formErrors.End_Date}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Status</label>
              <select name="Status" value={form.Status} onChange={handleChange}
                className="p-3 text-base border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 min-h-[44px] appearance-none">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex gap-2.5 mt-3 flex-wrap">
              <button type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-md text-sm font-medium cursor-pointer transition-all min-h-[44px] bg-black text-white hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none">
                {editing ? 'Update Promotion' : 'Add Promotion'}
              </button>
              <button type="button" onClick={resetForm}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-md text-sm font-medium cursor-pointer transition-all min-h-[44px] bg-white text-neutral-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row md:items-end gap-2.5 mb-5">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Search by title, description, or discount type..." value={search} onChange={handleSearchChange}
            className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400" />
          {search && (
            <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 p-1 rounded hover:bg-gray-100 hover:text-neutral-900">
              <X size={14} />
            </button>
          )}
        </div>
        <select value={statusFilter} onChange={handleStatusFilter}
          className="p-2.5 text-sm border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-black bg-white text-neutral-900 min-h-[44px] w-full md:w-auto md:min-w-[180px] appearance-none">
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Expired">Expired</option>
        </select>
        <select value={typeFilter} onChange={handleTypeFilter}
          className="p-2.5 text-sm border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-black bg-white text-neutral-900 min-h-[44px] w-full md:w-auto md:min-w-[180px] appearance-none">
          <option value="">All Types</option>
          <option value="free">Free</option>
          <option value="percentage">Percentage</option>
          <option value="FLAT_RATE">Flat Rate</option>
          <option value="CASHBACK">Cashback</option>
          <option value="BUY_ONE_GET_ONE">BOGO</option>
          <option value="Bundle">Bundle</option>
          <option value="amount">Amount</option>
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-sm text-gray-500">Loading promotions...</div> : (
        <>
          <div className="overflow-x-auto bg-white shadow-sm border border-gray-200 -mx-4 md:mx-0 md:rounded-xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">ID</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Title</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Discount Type</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Value</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Start Date</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">End Date</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Status</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promotions.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-10 text-sm text-gray-500">No promotions found</td></tr>
                ) : promotions.map(p => (
                  <tr key={p.PromotionID} className="hover:bg-gray-50">
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{p.PromotionID}</td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm"><strong className="font-semibold text-neutral-950">{p.Title}</strong></td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">
                      <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">{getDiscountTypeLabel(p.Discount_Type)}</span>
                    </td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{p.Discount_Value}{p.Discount_Type === 'percentage' ? '%' : ''}</td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm whitespace-nowrap">{p.Start_Date}</td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm whitespace-nowrap">{p.End_Date}</td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-semibold tracking-[0.2px] ${
                        p.Status === 'Active' ? 'bg-black text-white' :
                        p.Status === 'Inactive' ? 'bg-gray-200 text-gray-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>{p.Status}</span>
                    </td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100">
                      <div className="flex gap-1 whitespace-nowrap">
                        <Link to={`/promotions/${p.PromotionID}/vehicles`}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:border-gray-400"
                          title="Link Vehicles"><Car size={14} /></Link>
                        <button onClick={() => handleEdit(p)} title="Edit"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:border-gray-400"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(p.PromotionID)} title="Delete"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:border-gray-400"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6 py-4">
              <button disabled={pagination.page <= 1} onClick={() => fetchPromotions(search, statusFilter, typeFilter, pagination.page - 1)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-white text-neutral-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"><ArrowLeft size={14} /> Previous</button>
              <span className="text-sm text-gray-500 font-medium">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchPromotions(search, statusFilter, typeFilter, pagination.page + 1)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-white text-neutral-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed">Next <ArrowRight size={14} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Promotions;
