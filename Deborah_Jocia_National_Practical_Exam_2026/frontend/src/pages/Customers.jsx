import { useState, useEffect } from 'react';
import API from '../services/api';
import { Users, Search, X, Pencil, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

const STATUS_OPTIONS = ['Active', 'Inactive', 'Blocked'];

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    FirstName: '', LastName: '', Email: '', PhoneNumber: '', Status: 'Active'
  });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async (searchTerm = '', page = 1) => {
    try {
      let url = `/customers?page=${page}&limit=20`;
      if (searchTerm) url += `&search=${searchTerm}`;
      const res = await API.get(url);
      setCustomers(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(search, 1);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ FirstName: '', LastName: '', Email: '', PhoneNumber: '', Status: 'Active' });
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await API.put(`/customers/${editing.CustomerID}`, form);
      } else {
        await API.post('/customers', form);
      }
      resetForm();
      fetchCustomers(search, pagination.page);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Operation failed');
    }
  };

  const handleEdit = (customer) => {
    setForm({
      FirstName: customer.FirstName,
      LastName: customer.LastName,
      Email: customer.Email,
      PhoneNumber: customer.PhoneNumber,
      Status: customer.Status
    });
    setEditing(customer);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await API.delete(`/customers/${id}`);
      fetchCustomers(search, pagination.page);
    } catch (err) {
      setError('Failed to delete customer');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><Users size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Customers Management</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? <><X size={14} style={{ marginRight: '4px' }} /> Cancel</> : '+ Add Customer'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h3>{editing ? 'Edit Customer' : 'Add New Customer'}</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>First Name *</label>
              <input name="FirstName" value={form.FirstName} onChange={handleChange} placeholder="First name" required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input name="LastName" value={form.LastName} onChange={handleChange} placeholder="Last name" required />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input name="Email" type="email" value={form.Email} onChange={handleChange} placeholder="email@example.com" required />
            </div>
            <div className="form-group">
              <label>Phone Number *</label>
              <input name="PhoneNumber" value={form.PhoneNumber} onChange={handleChange} placeholder="+250 7XX XXX XXX" required />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="Status" value={form.Status} onChange={handleChange}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editing ? 'Update Customer' : 'Add Customer'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <form onSubmit={handleSearch} className="search-bar">
        <input type="text" placeholder="Search by name, email, or phone..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="btn btn-primary"><Search size={14} style={{ marginRight: '4px' }} /> Search</button>
        {search && <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); fetchCustomers('', 1); }}><X size={14} style={{ marginRight: '4px' }} /> Clear</button>}
      </form>

      {loading ? <div className="loading">Loading customers...</div> : (
        <>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan="7" className="empty-table">No customers found</td></tr>
                ) : customers.map(c => (
                  <tr key={c.CustomerID}>
                    <td>{c.CustomerID}</td>
                    <td><strong>{c.FirstName} {c.LastName}</strong></td>
                    <td>{c.Email}</td>
                    <td>{c.PhoneNumber}</td>
                    <td>{c.CreatedAt}</td>
                    <td><span className={`status-badge status-${c.Status?.toLowerCase()}`}>{c.Status}</span></td>
                    <td className="action-btns">
                      <button className="btn btn-sm btn-edit" onClick={() => handleEdit(c)} title="Edit"><Pencil size={14} /></button>
                      <button className="btn btn-sm btn-delete" onClick={() => handleDelete(c.CustomerID)} title="Delete"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-sm" disabled={pagination.page <= 1}
                onClick={() => fetchCustomers(search, pagination.page - 1)}><ArrowLeft size={14} style={{ marginRight: '4px' }} /> Previous</button>
              <span className="page-info">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
              <button className="btn btn-sm" disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchCustomers(search, pagination.page + 1)}>Next <ArrowRight size={14} style={{ marginLeft: '4px' }} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Customers;
