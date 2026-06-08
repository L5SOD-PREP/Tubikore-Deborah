import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { ArrowLeft, Car, Trash2 } from 'lucide-react';

function PromotionVehicles() {
  const { id } = useParams();
  const [promotion, setPromotion] = useState(null);
  const [linkedVehicles, setLinkedVehicles] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [selectedPlate, setSelectedPlate] = useState('');
  const [performance, setPerformance] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [promoRes, linkedRes, vehiclesRes] = await Promise.all([
        API.get(`/promotions/${id}`),
        API.get(`/promotions/${id}/vehicles`),
        API.get('/vehicles')
      ]);
      setPromotion(promoRes.data);
      setLinkedVehicles(linkedRes.data);
      setAllVehicles(vehiclesRes.data.data || []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!selectedPlate) return;
    setError('');
    setMessage('');
    try {
      await API.post(`/promotions/${id}/vehicles`, {
        Plate_Number: selectedPlate,
        Performance: performance
      });
      setSelectedPlate('');
      setPerformance('');
      setMessage('Vehicle linked successfully!');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to link vehicle');
    }
  };

  const handleUnlink = async (plate) => {
    if (!confirm(`Remove ${plate} from this promotion?`)) return;
    try {
      await API.delete(`/promotions/${id}/vehicles/${plate}`);
      fetchData();
    } catch (err) {
      setError('Failed to unlink vehicle');
    }
  };

  const handleUpdatePerformance = async (plate, newPerformance) => {
    try {
      await API.put(`/promotions/${id}/vehicles/${plate}`, { Performance: newPerformance });
      setMessage('Performance updated!');
      fetchData();
    } catch (err) {
      setError('Failed to update performance');
    }
  };

  // Filter out already linked vehicles
  const availableVehicles = allVehicles.filter(v =>
    !linkedVehicles.find(lv => lv.Plate_Number === v.Plate_Number)
  );

  if (loading) return (
    <div className="text-center py-12 text-sm text-gray-500">Loading...</div>
  );

  if (!promotion) return (
    <div className="flex-1 flex flex-col p-4 md:p-7 lg:p-10">
      <div className="p-3 rounded-lg text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">Promotion not found</div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col p-4 md:p-7 lg:p-10">
      <div className="mb-5">
        <Link to="/promotions" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors mb-3 no-underline">
          <ArrowLeft size={14} /> Back to Promotions
        </Link>
        <h1 className="text-xl md:text-lg lg:text-2xl font-bold text-black flex items-center gap-2">
          <Car size={24} /> Link Vehicles to Promotion
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          <strong className="text-neutral-950">{promotion.Title}</strong> — {promotion.Discount_Type} discount of {promotion.Discount_Value}
          {promotion.Discount_Type === 'percentage' ? '%' : ''}
        </p>
      </div>

      {error && <div className="p-3 rounded-lg mb-4 text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">{error}</div>}
      {message && <div className="p-3 rounded-lg mb-4 text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">{message}</div>}

      <div className="bg-white rounded-xl p-5 mb-6 shadow-sm border border-gray-200">
        <h3 className="mb-4 text-base font-semibold text-neutral-900">Link a Vehicle</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Select Vehicle</label>
            <select value={selectedPlate} onChange={(e) => setSelectedPlate(e.target.value)}
              className="w-full p-3 text-base border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 min-h-[44px] appearance-none">
              <option value="">-- Choose a vehicle --</option>
              {availableVehicles.map(v => (
                <option key={v.Plate_Number} value={v.Plate_Number}>
                  {v.Plate_Number} — {v.Brand} {v.Model} ({v.Year})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.4px]">Performance</label>
            <input type="text" value={performance} onChange={(e) => setPerformance(e.target.value)}
              placeholder="e.g. Excellent, Good, Average"
              className="w-full p-3 text-base border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900 placeholder:text-gray-400" />
          </div>
          <button className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-md text-sm font-medium cursor-pointer transition-all min-h-[44px] bg-black text-white hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleLink} disabled={!selectedPlate}>
            Link Vehicle
          </button>
        </div>
      </div>

      <h3 className="text-base font-semibold text-neutral-900 mb-4">Linked Vehicles ({linkedVehicles.length})</h3>
      <div className="overflow-x-auto bg-white shadow-sm border border-gray-200 -mx-4 md:mx-0 md:rounded-xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Plate Number</th>
              <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Brand</th>
              <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Model</th>
              <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Year</th>
              <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Performance</th>
              <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {linkedVehicles.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-10 text-sm text-gray-500">No vehicles linked to this promotion yet</td></tr>
            ) : linkedVehicles.map(v => (
              <tr key={v.Plate_Number} className="hover:bg-gray-50">
                <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm font-semibold text-neutral-950">{v.Plate_Number}</td>
                <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{v.Brand}</td>
                <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{v.Model}</td>
                <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{v.Year}</td>
                <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">
                  <input type="text" defaultValue={v.Performance || ''}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md transition-colors focus:outline-none focus:border-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)] bg-white text-neutral-900"
                    onBlur={(e) => {
                      if (e.target.value !== (v.Performance || '')) {
                        handleUpdatePerformance(v.Plate_Number, e.target.value);
                      }
                    }}
                    placeholder="Set performance" />
                </td>
                <td className="p-2.5 md:p-3 border-b border-gray-100">
                  <button className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:border-gray-400"
                    onClick={() => handleUnlink(v.Plate_Number)} title="Unlink vehicle">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PromotionVehicles;
