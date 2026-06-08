import { useState, useEffect, useRef, useCallback } from 'react';
import API from '../services/api';
import { Car, Search, X, Pencil, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { validateVehicle } from '../utils/validation';

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    Plate_Number: '', Brand: '', Model: '', Year: '',
    Vehicle_Type: '', Purchase_Price: '', Status: 'Available'
  });
  const [formErrors, setFormErrors] = useState({});
  const debounceRef = useRef(null);

  const fetchVehicles = useCallback(async (searchTerm = '', status = '', page = 1) => {
    try {
      let url = `/vehicles?page=${page}&limit=20`;
      if (searchTerm) url += `&search=${searchTerm}`;
      const res = await API.get(url);
      let data = res.data.data || [];
      if (status) data = data.filter(v => v.Status === status);
      setVehicles(data);
      setPagination(res.data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch { setError('Failed to load vehicles'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchVehicles(value, statusFilter, 1), 350);
  };

  const handleStatusFilter = (e) => { setStatusFilter(e.target.value); fetchVehicles(search, e.target.value, 1); };
  const clearSearch = () => { setSearch(''); setStatusFilter(''); fetchVehicles('', '', 1); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
  };

  const resetForm = () => {
    setForm({ Plate_Number: '', Brand: '', Model: '', Year: '', Vehicle_Type: '', Purchase_Price: '', Status: 'Available' });
    setFormErrors({}); setEditing(null); setShowForm(false); setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setFormErrors({});
    const { valid, errors } = validateVehicle(form, !!editing);
    if (!valid) { setFormErrors(errors); return; }
    try {
      if (editing) await API.put(`/vehicles/${editing.Plate_Number}`, form);
      else await API.post('/vehicles', form);
      resetForm(); fetchVehicles(search, statusFilter, pagination.page);
    } catch (err) { setError(err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Operation failed'); }
  };

  const handleEdit = (vehicle) => {
    setForm({
      Plate_Number: vehicle.Plate_Number, Brand: vehicle.Brand, Model: vehicle.Model,
      Year: vehicle.Year, Vehicle_Type: vehicle.Vehicle_Type,
      Purchase_Price: vehicle.Purchase_Price, Status: vehicle.Status
    });
    setFormErrors({}); setEditing(vehicle); setShowForm(true);
  };

  const handleDelete = async (plate) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try { await API.delete(`/vehicles/${plate}`); fetchVehicles(search, statusFilter, pagination.page); }
    catch { setError('Failed to delete vehicle'); }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-7 lg:p-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-5 gap-2">
        <h1 className="text-xl md:text-lg lg:text-2xl font-bold text-black flex items-center gap-2"><Car size={24} /> Vehicles Management</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-md text-sm font-medium cursor-pointer transition-all min-h-[44px] bg-black text-white hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0">
            {showForm ? <><X size={14} /> Cancel</> : '+ Add Vehicle'}
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg mb-4 text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-xl p-5 mb-5 shadow-sm border border-gray-200">
          <h3 className="mb-4 text-base font-semibold text-neutral-900">{editing ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5" noValidate>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Plate Number *</label>
              <input name="Plate_Number" value={form.Plate_Number} onChange={handleChange} placeholder="e.g. RAC-123-A" required disabled={editing}
                className={`p-3 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400 ${formErrors.Plate_Number ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`} />
              {formErrors.Plate_Number && <span className="text-xs text-red-600 font-medium">{formErrors.Plate_Number}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Brand *</label>
              <input name="Brand" value={form.Brand} onChange={handleChange} placeholder="e.g. Toyota" required
                className={`p-3 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400 ${formErrors.Brand ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`} />
              {formErrors.Brand && <span className="text-xs text-red-600 font-medium">{formErrors.Brand}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Model *</label>
              <input name="Model" value={form.Model} onChange={handleChange} placeholder="e.g. Corolla" required
                className={`p-3 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400 ${formErrors.Model ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`} />
              {formErrors.Model && <span className="text-xs text-red-600 font-medium">{formErrors.Model}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Year *</label>
              <input name="Year" type="number" value={form.Year} onChange={handleChange} placeholder="e.g. 2025" required
                className={`p-3 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400 ${formErrors.Year ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`} />
              {formErrors.Year && <span className="text-xs text-red-600 font-medium">{formErrors.Year}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Vehicle Type *</label>
              <select name="Vehicle_Type" value={form.Vehicle_Type} onChange={handleChange} required
                className={`p-3 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 min-h-[44px] appearance-none ${formErrors.Vehicle_Type ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`}>
                <option value="">Select type</option>
                <option value="Sedan">Sedan</option><option value="SUV">SUV</option><option value="Truck">Truck</option>
                <option value="Van">Van</option><option value="Motorcycle">Motorcycle</option><option value="Bus">Bus</option><option value="Convertible">Convertible</option>
              </select>
              {formErrors.Vehicle_Type && <span className="text-xs text-red-600 font-medium">{formErrors.Vehicle_Type}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Purchase Price *</label>
              <input name="Purchase_Price" type="number" step="0.01" value={form.Purchase_Price} onChange={handleChange} placeholder="e.g. 25000" required
                className={`p-3 text-base border rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400 ${formErrors.Purchase_Price ? '!border-red-600 !shadow-[0_0_0_3px_rgba(211,47,47,0.08)]' : 'border-gray-300'}`} />
              {formErrors.Purchase_Price && <span className="text-xs text-red-600 font-medium">{formErrors.Purchase_Price}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Status</label>
              <select name="Status" value={form.Status} onChange={handleChange}
                className="p-3 text-base border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 min-h-[44px] appearance-none">
                <option value="Available">Available</option><option value="Rented">Rented</option><option value="Sold">Sold</option><option value="Maintenance">Maintenance</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex gap-2.5 mt-3 flex-wrap">
              <button type="submit" className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-md text-sm font-medium cursor-pointer transition-all min-h-[44px] bg-black text-white hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none">
                {editing ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
              <button type="button" onClick={resetForm} className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-md text-sm font-medium cursor-pointer transition-all min-h-[44px] bg-white text-neutral-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row md:items-end gap-2.5 mb-5">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Search by plate, brand, model, or type..." value={search} onChange={handleSearchChange}
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
          <option value="Available">Available</option><option value="Rented">Rented</option><option value="Sold">Sold</option><option value="Maintenance">Maintenance</option>
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-sm text-gray-500">Loading vehicles...</div> : (
        <>
          <div className="overflow-x-auto bg-white shadow-sm border border-gray-200 -mx-4 md:mx-0 md:rounded-xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Plate Number</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Brand</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Model</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Year</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Type</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Price</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Status</th>
                  <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-10 text-sm text-gray-500">No vehicles found</td></tr>
                ) : vehicles.map(v => (
                  <tr key={v.Plate_Number} className="hover:bg-gray-50">
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm"><strong className="font-semibold text-neutral-950">{v.Plate_Number}</strong></td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{v.Brand}</td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{v.Model}</td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{v.Year}</td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm"><span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">{v.Vehicle_Type}</span></td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">${parseFloat(v.Purchase_Price).toLocaleString()}</td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-semibold tracking-[0.2px] ${
                        v.Status === 'Available' ? 'bg-black text-white' :
                        v.Status === 'Rented' ? 'bg-gray-200 text-gray-700' :
                        v.Status === 'Sold' ? 'bg-gray-100 text-gray-500' :
                        'bg-gray-50 text-gray-400 border border-gray-200'
                      }`}>{v.Status}</span>
                    </td>
                    <td className="p-2.5 md:p-3 border-b border-gray-100">
                      <div className="flex gap-1 whitespace-nowrap">
                        <button onClick={() => handleEdit(v)} title="Edit"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:border-gray-400"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(v.Plate_Number)} title="Delete"
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
              <button disabled={pagination.page <= 1} onClick={() => fetchVehicles(search, statusFilter, pagination.page - 1)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-white text-neutral-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"><ArrowLeft size={14} /> Previous</button>
              <span className="text-sm text-gray-500 font-medium">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchVehicles(search, statusFilter, pagination.page + 1)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-white text-neutral-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed">Next <ArrowRight size={14} /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Vehicles;
