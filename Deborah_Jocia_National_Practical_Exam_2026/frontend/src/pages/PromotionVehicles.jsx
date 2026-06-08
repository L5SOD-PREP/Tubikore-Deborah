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

  if (loading) return <div className="loading">Loading...</div>;

  if (!promotion) return <div className="alert alert-error">Promotion not found</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Link to="/promotions" className="back-link"><ArrowLeft size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Back to Promotions</Link>
          <h1><Car size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Link Vehicles to Promotion</h1>
          <p className="promo-summary">
            <strong>{promotion.Title}</strong> — {promotion.Discount_Type} discount of {promotion.Discount_Value}
            {promotion.Discount_Type === 'percentage' ? '%' : ''}
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="form-card">
        <h3>Link a Vehicle</h3>
        <div className="form-inline">
          <div className="form-group">
            <label>Select Vehicle</label>
            <select value={selectedPlate} onChange={(e) => setSelectedPlate(e.target.value)}>
              <option value="">-- Choose a vehicle --</option>
              {availableVehicles.map(v => (
                <option key={v.Plate_Number} value={v.Plate_Number}>
                  {v.Plate_Number} — {v.Brand} {v.Model} ({v.Year})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Performance</label>
            <input type="text" value={performance} onChange={(e) => setPerformance(e.target.value)}
              placeholder="e.g. Excellent, Good, Average" />
          </div>
          <button className="btn btn-primary" style={{ marginTop: '24px' }}
            onClick={handleLink} disabled={!selectedPlate}>
            Link Vehicle
          </button>
        </div>
      </div>

      <h3>Linked Vehicles ({linkedVehicles.length})</h3>
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Plate Number</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Year</th>
              <th>Performance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {linkedVehicles.length === 0 ? (
              <tr><td colSpan="6" className="empty-table">No vehicles linked to this promotion yet</td></tr>
            ) : linkedVehicles.map(v => (
              <tr key={v.Plate_Number}>
                <td><strong>{v.Plate_Number}</strong></td>
                <td>{v.Brand}</td>
                <td>{v.Model}</td>
                <td>{v.Year}</td>
                <td>
                  <input type="text" defaultValue={v.Performance || ''}
                    className="perf-input"
                    onBlur={(e) => {
                      if (e.target.value !== (v.Performance || '')) {
                        handleUpdatePerformance(v.Plate_Number, e.target.value);
                      }
                    }}
                    placeholder="Set performance" />
                </td>
                <td>
                  <button className="btn btn-sm btn-delete" onClick={() => handleUnlink(v.Plate_Number)} title="Unlink vehicle">
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
