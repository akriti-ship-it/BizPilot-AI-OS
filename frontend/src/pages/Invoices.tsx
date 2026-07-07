import React, { useEffect, useState } from 'react';
import { invoiceService } from '../services/api';
import { FileText, Upload, CheckCircle, AlertCircle, FileJson, Sparkles } from 'lucide-react';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [workflowLogs, setWorkflowLogs] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchInvoices = async () => {
    try {
      const data = await invoiceService.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setUploading(true);
    setError('');
    setSuccess('');
    setWorkflowLogs([]);
    
    try {
      const data = await invoiceService.uploadInvoice(file);
      setSuccess(`Invoice '${data.invoice.invoice_number}' processed successfully!`);
      setWorkflowLogs(data.workflow_logs || []);
      fetchInvoices();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to upload and parse invoice PDF.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">Invoice Ledger & OCR</h2>
        <p className="text-xs md:text-sm text-slate-400">Upload invoices to automatically extract data and update stock levels</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload and workflow logs column */}
        <div className="space-y-6 lg:col-span-1">
          {/* Upload card */}
          <div className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Upload Invoice PDF</h3>
            
            <div className="border-2 border-dashed border-[#1f2937] hover:border-indigo-500/50 rounded-xl p-8 text-center cursor-pointer transition-all relative group bg-slate-950/20">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-300 font-semibold">Click to upload or drag invoice here</p>
                  <p className="text-[10px] text-slate-500 mt-1">Supports PDF or Image formats</p>
                </div>
              </div>
            </div>

            {uploading && (
              <div className="flex items-center justify-center gap-2 py-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                <div className="w-4 h-4 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                <span className="text-xs text-indigo-400 font-mono animate-pulse">Invoice Agent processing OCR...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl flex items-start gap-2 text-xs">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </div>

          {/* Flow orchestration logs */}
          {workflowLogs.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                OCR Agent Collaboration Flow
              </h3>
              
              <div className="space-y-3 font-mono text-[10px]">
                {workflowLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-[#1f2937]/15 pb-2 last:border-0 last:pb-0">
                    <span className="text-indigo-400 font-semibold">[{log.agent}]</span>{' '}
                    <span className="text-slate-300">{log.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Invoice list table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl border border-[#1f2937]/30 overflow-hidden shadow-2xl">
            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="w-8 h-8 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#0f1119] border-b border-[#1f2937]/40 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="p-4">Invoice #</th>
                      <th className="p-4">Customer ID</th>
                      <th className="p-4">Total Amount</th>
                      <th className="p-4">Issue Date</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Payload</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f2937]/20 text-slate-300">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-[#12141f]/35 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-white">{inv.invoice_number}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs">Customer #{inv.customer_id || 'Walk-in'}</td>
                        <td className="p-4 font-semibold text-white">${inv.amount.toFixed(2)}</td>
                        <td className="p-4 text-xs text-slate-400">{inv.issue_date.split('T')[0]}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            inv.status === 'paid' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition"
                            title="View Extracted JSON"
                          >
                            <FileJson className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No invoices parsed yet. Upload an invoice PDF to test the OCR Agent flow.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Extracted JSON Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-[#1f2937]/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2">Extracted Structured JSON</h3>
            <p className="text-xs text-slate-400 mb-4">Invoice #{selectedInvoice.invoice_number}</p>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-[#1f2937] overflow-x-auto max-h-[300px]">
              <pre className="text-xs text-indigo-300 font-mono">
                {JSON.stringify(selectedInvoice.extracted_json, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl active:scale-95 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
