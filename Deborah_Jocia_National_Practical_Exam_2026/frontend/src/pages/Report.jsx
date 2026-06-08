import { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { ClipboardList, FileText, FileSpreadsheet, Printer, BarChart3, ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);
import * as XLSX from 'xlsx';

function Report() {
  const [reportData, setReportData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState({ pdf: false, excel: false });
  const reportRef = useRef(null);

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

  const exportPDF = async () => {
    if (reportData.length === 0) return;
    setExporting(prev => ({ ...prev, pdf: true }));

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // === Header ===
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SwiftWheels Enterprises — Customer Promotions Report', 14, 18);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}`, 14, 28);

      // === Summary ===
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.text(`Total Records: ${pagination.total}  |  Report Type: Active Customers × Available Vehicles × Active Promotions`, 14, 43);

      // === Table ===
      const tableHeaders = [['#', 'Customer Name', 'Email', 'Phone', 'Vehicle', 'Plate Number', 'Promotion', 'Discount', 'Performance']];
      const tableData = reportData.map((row, idx) => [
        (pagination.page - 1) * 50 + idx + 1,
        row.CustomerName || '—',
        row.CustomerEmail || '—',
        row.CustomerPhone || '—',
        `${row.VehicleBrand || ''} ${row.VehicleModel || ''}`.trim() || '—',
        row.VehiclePlate || '—',
        row.PromotionTitle || '—',
        `${formatDiscountValue(row.DiscountValue, row.DiscountType)}` || '—',
        row.Performance || '—',
      ]);

      doc.autoTable({
        head: tableHeaders,
        body: tableData,
        startY: 48,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: 4,
        },
        bodyStyles: {
          fontSize: 7.5,
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 35 },
          2: { cellWidth: 40 },
          3: { cellWidth: 30 },
          4: { cellWidth: 35 },
          5: { cellWidth: 25 },
          6: { cellWidth: 40 },
          7: { cellWidth: 25, halign: 'center' },
          8: { cellWidth: 20, halign: 'center' },
        },
        tableWidth: 'auto',
        margin: { left: 10, right: 10 },
      });

      // === Footer ===
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(180, 180, 180);
        doc.text(
          `SwiftWheels PMS — Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        );
        doc.text(
          'Deborah Jocia — National Practical Exam 2026',
          doc.internal.pageSize.getWidth() - 14,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'right' }
        );
      }

      doc.save('swiftwheels_customer_promotions_report.pdf');
    } catch (err) {
      setError('Failed to generate PDF: ' + err.message);
    } finally {
      setExporting(prev => ({ ...prev, pdf: false }));
    }
  };

  const exportExcel = async () => {
    if (reportData.length === 0) return;
    setExporting(prev => ({ ...prev, excel: true }));

    try {
      const data = reportData.map((row, idx) => ({
        '#': (pagination.page - 1) * 50 + idx + 1,
        'Customer Name': row.CustomerName || '',
        'Customer Email': row.CustomerEmail || '',
        'Customer Phone': row.CustomerPhone || '',
        'Vehicle Brand': row.VehicleBrand || '',
        'Vehicle Model': row.VehicleModel || '',
        'Vehicle Plate': row.VehiclePlate || '',
        'Promotion Title': row.PromotionTitle || '',
        'Discount Value': formatDiscountValue(row.DiscountValue, row.DiscountType),
        'Discount Type': row.DiscountTypeLabel || '',
        'Performance': row.Performance || '',
        'Promotion Start': row.PromotionStart || '',
        'Promotion End': row.PromotionEnd || '',
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Column widths
      ws['!cols'] = [
        { wch: 5 },   // #
        { wch: 25 },  // Customer Name
        { wch: 30 },  // Email
        { wch: 18 },  // Phone
        { wch: 15 },  // Vehicle Brand
        { wch: 15 },  // Vehicle Model
        { wch: 15 },  // Vehicle Plate
        { wch: 25 },  // Promotion Title
        { wch: 15 },  // Discount Value
        { wch: 15 },  // Discount Type
        { wch: 12 },  // Performance
        { wch: 15 },  // Promotion Start
        { wch: 15 },  // Promotion End
      ];

      // Bold header row
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c: C });
        if (ws[addr]) ws[addr].s = { font: { bold: true, sz: 11 } };
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Customer Promotions');
      XLSX.writeFile(wb, 'swiftwheels_customer_promotions_report.xlsx');
    } catch (err) {
      setError('Failed to generate Excel: ' + err.message);
    } finally {
      setExporting(prev => ({ ...prev, excel: false }));
    }
  };

  const printReport = () => window.print();

  if (loading) return (
    <div className="text-center py-12 text-sm text-gray-500">Generating report...</div>
  );

  return (
    <div className="flex-1 flex flex-col p-4 md:p-7 lg:p-10" ref={reportRef}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-5 gap-2">
        <h1 className="text-xl md:text-lg lg:text-2xl font-bold text-black flex items-center gap-2">
          <ClipboardList size={24} /> Customer Promotions Report
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium cursor-pointer transition-all min-h-[36px] bg-black text-white hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={exportPDF} disabled={reportData.length === 0 || exporting.pdf}>
            <FileText size={14} /> {exporting.pdf ? 'Generating...' : 'Export PDF'}
          </button>
          <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium cursor-pointer transition-all min-h-[36px] bg-black text-white hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={exportExcel} disabled={reportData.length === 0 || exporting.excel}>
            <FileSpreadsheet size={14} /> {exporting.excel ? 'Generating...' : 'Export Excel'}
          </button>
          <button className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium cursor-pointer transition-all min-h-[36px] bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 hover:border-gray-400"
            onClick={printReport} title="Print">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg mb-4 text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">{error}</div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-5">
        <span className="text-sm text-gray-500">
          Showing <strong>{pagination.total}</strong> records of active customers with available vehicles and active promotions.
        </span>
        <span className="text-xs text-gray-400">
          Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="overflow-x-auto bg-white shadow-sm border border-gray-200 -mx-4 md:mx-0 md:rounded-xl">
        <table className="w-full border-collapse" id="report-table">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">#</th>
              <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Customer Name</th>
              <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Vehicle Brand</th>
              <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Vehicle Model</th>
              <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Plate Number</th>
              <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Promotion Title</th>
              <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Discount</th>
              <th className="p-2.5 md:p-3 text-left text-[0.7rem] font-semibold text-gray-500 uppercase tracking-[0.4px] whitespace-nowrap border-b border-gray-200">Performance</th>
            </tr>
          </thead>
          <tbody>
            {reportData.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-10 text-sm text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <BarChart3 size={40} className="text-gray-300" />
                    <p>No report data available.</p>
                    <p className="text-xs text-gray-400">Add active customers, available vehicles, and active promotions with links.</p>
                  </div>
                </td>
              </tr>
            ) : reportData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{(pagination.page - 1) * 50 + idx + 1}</td>
                <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">
                  <div className="font-semibold text-neutral-950">{row.CustomerName}</div>
                  <div className="text-xs text-gray-400">{row.CustomerEmail}</div>
                </td>
                <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{row.VehicleBrand}</td>
                <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{row.VehicleModel}</td>
                <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">
                  <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                    {row.VehiclePlate}
                  </span>
                </td>
                <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">{row.PromotionTitle}</td>
                <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">
                  <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                    {formatDiscountValue(row.DiscountValue, row.DiscountType)}
                  </span>
                </td>
                <td className="p-2.5 md:p-3 border-b border-gray-100 text-sm">
                  <span className={`inline-block px-3 py-1 rounded text-xs font-semibold tracking-[0.2px] ${
                    String(row.Performance || '').toLowerCase() === 'excellent' ? 'bg-black text-white' :
                    String(row.Performance || '').toLowerCase() === 'good' ? 'bg-gray-200 text-gray-700' :
                    String(row.Performance || '').toLowerCase() === 'average' ? 'bg-gray-100 text-gray-500' :
                    'bg-gray-50 text-gray-400 border border-gray-200'
                  }`}>
                    {row.Performance || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6 py-4">
          <button disabled={pagination.page <= 1} onClick={() => fetchReport(pagination.page - 1)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-white text-neutral-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"><ArrowLeft size={14} /> Previous</button>
          <span className="text-sm text-gray-500 font-medium">Page {pagination.page} of {pagination.totalPages}</span>
          <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchReport(pagination.page + 1)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-md font-medium cursor-pointer transition-all min-h-[36px] bg-white text-neutral-900 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed">Next <ArrowRight size={14} /></button>
        </div>
      )}
    </div>
  );
}

export default Report;
