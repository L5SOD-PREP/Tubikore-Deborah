import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../services/api';
import { Users, Search, X, Pencil, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { validateCustomer } from '../utils/validation';

const STATUS_OPTIONS = ['Active', 'Inactive', 'Blocked'];

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ FirstName: '', LastName: '', Email: '', PhoneNumber: '', Status: 'Active' });
  const [formErrors, setFormErrors] = useState({});
  const debounceRef = useRef(null);

  const fetchCustomers = useCallback(async (searchTerm = '', status = '', page = 1) => {
    try {
      let url = `/customers?page=${page}&limit=20`;
      if (searchTerm) url += `&search=${searchTerm}`;
      const res = await API.get(url);
      let data = res.data.data || [];
      if (status) data = data.filter(c => c.Status === status);
      setCustomers(data);
      setPagination(res.data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch { setError('Failed to load customers'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCustomers(value, statusFilter, 1), 350);
  };

  const handleStatusFilter = (e) => { setStatusFilter(e.target.value); fetchCustomers(search, e.target.value, 1); };
  const clearSearch = () => { setSearch(''); setStatusFilter(''); fetchCustomers('', '', 1); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
  };

  const resetForm = () => {
    setForm({ FirstName: '', LastName: '', Email: '', PhoneNumber: '', Status: 'Active' });
    setFormErrors({}); setEditing(null); setShowForm(false); setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setFormErrors({});
    const { valid, errors } = validateCustomer(form);
    if (!valid) { setFormErrors(errors); return; }
    try {
      if (editing) await API.put(`/customers/${editing.CustomerID}`, form);
      else await API.post('/customers', form);
      resetForm(); fetchCustomers(search, statusFilter, pagination.page);
    } catch (err) { setError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Operation failed'); }
  };

  const handleEdit = (customer) => {
    setForm({ FirstName: customer.FirstName, LastName: customer.LastName, Email: customer.Email, PhoneNumber: customer.PhoneNumber, Status: customer.Status });
    setFormErrors({}); setEditing(customer); setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try { await API.delete(`/customers/${id}`); fetchCustomers(search, statusFilter, pagination.page); }
    catch { setError('Failed to delete customer'); }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-7 lg:p-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-5 gap-2">
        <h1 className="text-xl md:text-lg lg:text-2xl font-bold text-black flex items-center gap-2"><Users size={24} /> Customers Management</h1>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-md text-sm font-medium cursor-pointer transition-all min-h-[44px] bg-black text-white hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0">
          {showForm ? <><X size={14} /> Cancel</> : '+ Add Customer'}
        </button>
      </div>

      {error && <div className="p-3 rounded-lg mb-4 text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-xl p-5 mb-5 shadow-sm border border-gray-200">
          <h3 className="mb-4 text-base font-semibold text-neutral-900">{editing ? 'Edit Customer' : 'Add New Customer'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5" noValidate>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">First Name *</label>
              <input name="FirstName" value={form.FirstName} onChange={handleChange} placeholder="First name" required
                className={`p-3 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400 ${formErrors.FirstName ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`} />
              {formErrors.FirstName && <span className="text-xs text-red-600 font-medium">{formErrors.FirstName}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Last Name *</label>
              <input name="LastName" value={form.LastName} onChange={handleChange} placeholder="Last name" required
                className={`p-3 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400 ${formErrors.LastName ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`} />
              {formErrors.LastName && <span className="text-xs text-red-600 font-medium">{formErrors.LastName}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Email *</label>
              <input name="Email" type="email" value={form.Email} onChange={handleChange} placeholder="email@example.com" required
                className={`p-3 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400 ${formErrors.Email ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`} />
              {formErrors.Email && <span className="text-xs text-red-600 font-medium">{formErrors.Email}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Phone Number *</label>
              <input name="PhoneNumber" value={form.PhoneNumber} onChange={handleChange} placeholder="+250 7XX XXX XXX" required
                className={`p-3 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400 ${formErrors.PhoneNumber ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`} />
              {formErrors.PhoneNumber && <span className="text-xs text-red-600 font-medium">{formErrors.PhoneNumber}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Status</label>
              <select name="Status" value={form.Status} onChange={handleChange}
                className="p-3 text-base border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 min-h-[44px] appearance-none">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex gap-2.5 mt-3 flex-wrap">
              <button type="submit" className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-md text-sm font-medium cursor-pointer transition-all min-h-[44px] bg-black text-white hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none">
                {editing ? 'Update Customer' : 'Add Customer'}
              </button>
              <button type="button" onClick={resetForm} className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-md text-sm font-medium cursor-pointer transition-all min-h-[44px] bg-white text-neutral-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end gap-2.5 mb-5">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Search by name, email, or phone..." value={search} onChange={handleSearchChange}
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
          <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Blocked">Blocked</option>
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-sm text-gray-500">Loading customers...</div> : (
        <>
          <div className="overflow-x-auto bg-white shadow-sm border border-gray-200 -mx-4 md:mx-0 md:rounded-xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">ID</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Name</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Email</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Phone</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Created</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Status</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-10 text-sm text-gray-500">No customers found</td></tr>
                ) : customers.map(c => (
                  <tr key={c.CustomerID} className="hover:bg-gray-50">
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{c.CustomerID}</td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm"><strong className="font-semibold text-neutral-950">{c.FirstName} {c.LastName}</strong></td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{c.Email}</td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{c.PhoneNumber}</td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{c.CreatedAt}</td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-semibold tracking-[0.2px] ${
                        c.Status === 'Active' ? 'bg-black text-white' :
                        c.Status === 'Inactive' ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'
                      }`}>{c.Status}</span>
                    </td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100">
                      <div className="flex gap-1 whitespace-nowrap">
                        <button onClick={() => handleEdit(c)} title="Edit"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:border-gray-400"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(c.CustomerID)} title="Delete"
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
              <button disabled={pagination.page <= 1} onClick={() => fetchCustomers(search, statusFilter, pagination.page - 1)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-white text-neutral-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"><ArrowLeft size={14} /> Previous</button>
              <span className="text-sm text-gray-500 font-medium">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchCustomers(search, statusFilter, pagination.page + 1)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-white text-neutral-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed">Next <ArrowRight size={14} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Customers;
