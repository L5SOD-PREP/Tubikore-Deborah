import { useState, useEffect } from 'react';
import API from '../services/api';
import { ClipboardList, Download, Printer, BarChart3, ArrowLeft, ArrowRight } from 'lucide-react';

function Report() {
  const [reportData, setReportData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async (page = 1) => {
    try {
      const res = await API.get(`/reports/customer-promotions?page=${page}&limit=50`);
      setReportData(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const formatDiscountValue = (value, type) => {
    const labels = {
      'free': 'Free', 'percentage': '%', 'FLAT_RATE': '$',
      'CASHBACK': '$ cashback', 'BUY_ONE_GET_ONE': '',
      'Bundle': '', 'amount': '$'
    };
    const prefix = labels[type] || '';
    if (type === 'free') return 'Free';
    if (type === 'BUY_ONE_GET_ONE') return 'BOGO';
    if (type === 'Bundle') return 'Bundle';
    return `${prefix}${value}`;
  };

  const exportCSV = () => {
    if (reportData.length === 0) return;
    const headers = ['Customer Name', 'Customer Email', 'Customer Phone', 'Vehicle Brand', 'Vehicle Model',
      'Vehicle Plate', 'Promotion Title', 'Discount Value', 'Discount Type', 'Performance'];
    const csvRows = [headers.join(',')];
    reportData.forEach(row => {
      const values = [
        `"${row.CustomerName || ''}"`, `"${row.CustomerEmail || ''}"`, `"${row.CustomerPhone || ''}"`,
        `"${row.VehicleBrand || ''}"`, `"${row.VehicleModel || ''}"`, `"${row.VehiclePlate || ''}"`,
        `"${row.PromotionTitle || ''}"`, `"${row.DiscountValue || ''}"`, `"${row.DiscountTypeLabel || ''}"`,
        `"${row.Performance || ''}"`
      ];
      csvRows.push(values.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_promotions_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const printReport = () => window.print();

  if (loading) return <div className="loading">Generating report...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><ClipboardList size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Customer Promotions Report</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={exportCSV} disabled={reportData.length === 0}>
            <Download size={14} style={{ marginRight: '4px' }} /> Export CSV
          </button>
          <button className="btn btn-secondary" onClick={printReport}><Printer size={14} style={{ marginRight: '4px' }} /> Print</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="report-summary">
        <p>Showing {pagination.total} records of active customers with available vehicles and active promotions.</p>
      </div>

      <div className="table-responsive">
        <table className="data-table report-table" id="report-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Customer Name</th>
              <th>Vehicle Brand</th>
              <th>Vehicle Model</th>
              <th>Promotion Title</th>
              <th>Discount Value</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            {reportData.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-table">
                  <div className="empty-report">
                    <span className="empty-icon"><BarChart3 size={40} /></span>
                    <p>No report data available.</p>
                    <p className="hint">Add active customers, available vehicles, and active promotions with links.</p>
                  </div>
                </td>
              </tr>
            ) : reportData.map((row, idx) => (
              <tr key={idx}>
                <td>{(pagination.page - 1) * 50 + idx + 1}</td>
                <td><strong>{row.CustomerName}</strong></td>
                <td>{row.VehicleBrand}</td>
                <td>{row.VehicleModel}</td>
                <td>{row.PromotionTitle}</td>
                <td><span className="badge">{formatDiscountValue(row.DiscountValue, row.DiscountType)}</span></td>
                <td>
                  <span className={`perf-badge ${String(row.Performance || '').toLowerCase() === 'excellent' ? 'perf-excellent' :
                    String(row.Performance || '').toLowerCase() === 'good' ? 'perf-good' :
                    String(row.Performance || '').toLowerCase() === 'average' ? 'perf-average' : ''}`}>
                    {row.Performance || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-sm" disabled={pagination.page <= 1}
            onClick={() => fetchReport(pagination.page - 1)}><ArrowLeft size={14} style={{ marginRight: '4px' }} /> Previous</button>
          <span className="page-info">Page {pagination.page} of {pagination.totalPages}</span>
          <button className="btn btn-sm" disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchReport(pagination.page + 1)}>Next <ArrowRight size={14} style={{ marginLeft: '4px' }} /></button>
        </div>
      )}
    </div>
  );
}

export default Report;
