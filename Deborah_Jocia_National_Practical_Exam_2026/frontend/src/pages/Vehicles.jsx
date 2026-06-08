import { useState, useEffect } from 'react';
import API from '../services/api';
import { Car, Search, X, Pencil, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    Plate_Number: '', Brand: '', Model: '', Year: '',
    Vehicle_Type: '', Purchase_Price: '', Status: 'Available'
  });

  useEffect(() => { fetchVehicles(); }, []);

  const fetchVehicles = async (searchTerm = '', page = 1) => {
    try {
      let url = `/vehicles?page=${page}&limit=20`;
      if (searchTerm) url += `&search=${searchTerm}`;
      const res = await API.get(url);
      setVehicles(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVehicles(search, 1);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ Plate_Number: '', Brand: '', Model: '', Year: '', Vehicle_Type: '', Purchase_Price: '', Status: 'Available' });
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await API.put(`/vehicles/${editing.Plate_Number}`, form);
      } else {
        await API.post('/vehicles', form);
      }
      resetForm();
      fetchVehicles(search, pagination.page);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Operation failed');
    }
  };

  const handleEdit = (vehicle) => {
    setForm({
      Plate_Number: vehicle.Plate_Number,
      Brand: vehicle.Brand,
      Model: vehicle.Model,
      Year: vehicle.Year,
      Vehicle_Type: vehicle.Vehicle_Type,
      Purchase_Price: vehicle.Purchase_Price,
      Status: vehicle.Status
    });
    setEditing(vehicle);
    setShowForm(true);
  };

  const handleDelete = async (plate) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await API.delete(`/vehicles/${plate}`);
      fetchVehicles(search, pagination.page);
    } catch (err) {
      setError('Failed to delete vehicle');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><Car size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Vehicles Management</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? <><X size={14} style={{ marginRight: '4px' }} /> Cancel</> : '+ Add Vehicle'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h3>{editing ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Plate Number *</label>
              <input name="Plate_Number" value={form.Plate_Number} onChange={handleChange}
                placeholder="e.g. RAC-123-A" required disabled={editing} />
            </div>
            <div className="form-group">
              <label>Brand *</label>
              <input name="Brand" value={form.Brand} onChange={handleChange} placeholder="e.g. Toyota" required />
            </div>
            <div className="form-group">
              <label>Model *</label>
              <input name="Model" value={form.Model} onChange={handleChange} placeholder="e.g. Corolla" required />
            </div>
            <div className="form-group">
              <label>Year *</label>
              <input name="Year" type="number" value={form.Year} onChange={handleChange} placeholder="e.g. 2025" required />
            </div>
            <div className="form-group">
              <label>Vehicle Type *</label>
              <select name="Vehicle_Type" value={form.Vehicle_Type} onChange={handleChange} required>
                <option value="">Select type</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Bus">Bus</option>
                <option value="Convertible">Convertible</option>
              </select>
            </div>
            <div className="form-group">
              <label>Purchase Price *</label>
              <input name="Purchase_Price" type="number" step="0.01" value={form.Purchase_Price}
                onChange={handleChange} placeholder="e.g. 25000" required />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="Status" value={form.Status} onChange={handleChange}>
                <option value="Available">Available</option>
                <option value="Rented">Rented</option>
                <option value="Sold">Sold</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editing ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <form onSubmit={handleSearch} className="search-bar">
        <input type="text" placeholder="Search by plate, brand, model, or type..." value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <button type="submit" className="btn btn-primary"><Search size={14} style={{ marginRight: '4px' }} /> Search</button>
        {search && <button type="button" className="btn btn-secondary" onClick={() => { setSearch(''); fetchVehicles('', 1); }}><X size={14} style={{ marginRight: '4px' }} /> Clear</button>}
      </form>

      {loading ? <div className="loading">Loading vehicles...</div> : (
        <>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plate Number</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Year</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr><td colSpan="8" className="empty-table">No vehicles found</td></tr>
                ) : vehicles.map(v => (
                  <tr key={v.Plate_Number}>
                    <td><strong>{v.Plate_Number}</strong></td>
                    <td>{v.Brand}</td>
                    <td>{v.Model}</td>
                    <td>{v.Year}</td>
                    <td><span className="badge">{v.Vehicle_Type}</span></td>
                    <td>${parseFloat(v.Purchase_Price).toLocaleString()}</td>
                    <td><span className={`status-badge status-${v.Status?.toLowerCase()}`}>{v.Status}</span></td>
                    <td className="action-btns">
                      <button className="btn btn-sm btn-edit" onClick={() => handleEdit(v)} title="Edit"><Pencil size={14} /></button>
                      <button className="btn btn-sm btn-delete" onClick={() => handleDelete(v.Plate_Number)} title="Delete"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-sm" disabled={pagination.page <= 1}
                onClick={() => fetchVehicles(search, pagination.page - 1)}><ArrowLeft size={14} style={{ marginRight: '4px' }} /> Previous</button>
              <span className="page-info">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
              <button className="btn btn-sm" disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchVehicles(search, pagination.page + 1)}>Next <ArrowRight size={14} style={{ marginLeft: '4px' }} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Vehicles;
