import React, { useEffect, useState } from 'react';
import { reportService } from '../services/api';
import { FileText, Download, FileSpreadsheet, Eye, Printer, AlertCircle } from 'lucide-react';

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await reportService.getReports();
        setReports(data);
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportCSV = (type: string) => {
    const downloadUrl = reportService.getCSVDownloadUrl(type);
    window.open(downloadUrl, '_blank');
  };

  const handleExportExcel = (type: string) => {
    const downloadUrl = reportService.getExcelDownloadUrl(type);
    window.open(downloadUrl, '_blank');
  };

  const handleExportPDF = (type: string) => {
    const downloadUrl = reportService.getPDFDownloadUrl(type);
    window.open(downloadUrl, '_blank');
  };

  const operationalExports = [
    {
      title: 'Current Inventory & Valuation Report',
      description: 'Contains product catalog details, stock levels, unit costs, retail prices, and safety stock flags.',
      type: 'inventory',
      icon: FileSpreadsheet,
    },
    {
      title: 'Sales & Invoicing Ledger Export',
      description: 'Contains a complete log of customer sales invoices, status, totals, and due date limits.',
      type: 'sales',
      icon: FileText,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">Reporting & Exports</h2>
        <p className="text-xs md:text-sm text-slate-400">Generate formatted spreadsheets and print-ready PDF reports dynamically</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {operationalExports.map((exp, idx) => (
          <div key={idx} className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 flex flex-col justify-between space-y-6 shadow-xl">
            <div className="flex gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0 h-fit border border-white/5">
                <exp.icon className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white leading-tight">{exp.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{exp.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <button
                onClick={() => handleExportCSV(exp.type)}
                className="px-3 py-2.5 bg-slate-900 hover:bg-[#181b24] border border-[#1f2937]/60 text-slate-200 text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => handleExportExcel(exp.type)}
                className="px-3 py-2.5 bg-[#12141a] hover:bg-[#1b1f2b] border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>Export Excel</span>
              </button>

              <button
                onClick={() => handleExportPDF(exp.type)}
                className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition shadow-lg shadow-indigo-600/10"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-200" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Analysts Report Logs */}
      <div className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Archived Business Analyst Reports</h3>
          <p className="text-xs text-slate-400">Reports compiled automatically by the Business Analyst Agent during operation cycles</p>
        </div>
        
        {loading ? (
          <div className="py-10 flex justify-center">
            <div className="w-6 h-6 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
          </div>
        ) : (
          <div className="divide-y divide-[#1f2937]/15">
            {reports.map((rep) => (
              <div key={rep.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-slate-200">{rep.title}</p>
                  <p className="text-slate-500">Agent: Business Analyst • Type: {rep.type} • Compiled: {rep.created_at.split('T')[0]}</p>
                </div>
                <button
                  onClick={() => alert(JSON.stringify(rep.content_json, null, 2))}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-[#1f2937]/50 rounded-lg text-[10px] font-semibold text-slate-300 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Content
                </button>
              </div>
            ))}
            {reports.length === 0 && (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6 text-slate-600" />
                <p>No compiled analyst reports in database records.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
