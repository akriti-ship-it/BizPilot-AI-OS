import React, { useEffect, useState } from 'react';
import { analyticsService } from '../services/api';
import { TrendingUp, Shield, Sparkles, CheckCircle2, AlertTriangle, PlayCircle } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export const Analytics: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [briefingData, setBriefingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const health = await analyticsService.getHealthScore();
      const briefing = await analyticsService.getCEOBriefing();
      setHealthData(health);
      setBriefingData(briefing);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
      </div>
    );
  }

  // Simulated forecasting data
  const forecastData = [
    { name: 'Week 1', Actual: 4000, Forecast: 4100 },
    { name: 'Week 2', Actual: 4500, Forecast: 4400 },
    { name: 'Week 3', Actual: 4700, Forecast: 4800 },
    { name: 'Week 4', Actual: 5100, Forecast: 5200 },
    { name: 'Week 5', Forecast: 5500 },
    { name: 'Week 6', Forecast: 5900 },
  ];

  const healthScore = healthData?.health_score || 85;
  const recommendations = healthData?.recommendations || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">Business Health & Forecasts</h2>
        <p className="text-xs md:text-sm text-slate-400">Calculate company risk indicators and project future sales metrics dynamically</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score Gauge */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 space-y-6 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Business Health Score</h3>
            <p className="text-xs text-slate-400">Operational efficiency score (0-100)</p>
          </div>

          <div className="relative flex flex-col items-center justify-center py-6">
            {/* Outer ring */}
            <div className="w-36 h-36 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
              {/* Highlight arc */}
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent border-r-transparent animate-spin [animation-duration:8s]"></div>
              
              <div className="text-center">
                <span className="text-4xl font-extrabold text-white tracking-tight">{healthScore}</span>
                <span className="block text-[10px] text-slate-500 font-mono mt-1">OPERATIONAL VALUE</span>
              </div>
            </div>
            
            <span className={`mt-4 px-3 py-1 rounded-full text-xs font-bold ${
              healthScore >= 80 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              Rating: {healthData?.rating || 'Good'}
            </span>
          </div>

          <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-center text-xs text-slate-400 leading-relaxed flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>AI diagnostic engines assess catalog safety levels and unpaid invoice risks hourly.</span>
          </div>
        </div>

        {/* AI Recommendations List */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 lg:col-span-2 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            AI Operating Recommendations
          </h3>
          
          <div className="space-y-3">
            {recommendations.map((rec: string, idx: number) => {
              const isCritical = rec.toLowerCase().includes('low stock') || rec.toLowerCase().includes('unpaid');
              return (
                <div 
                  key={idx} 
                  className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                    isCritical 
                      ? 'bg-red-500/5 border-red-500/10 text-red-400' 
                      : 'bg-slate-900/60 border-[#1f2937]/30 text-slate-300'
                  }`}
                >
                  {isCritical ? (
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  <p className="text-xs font-medium leading-relaxed">{rec}</p>
                </div>
              );
            })}
            {recommendations.length === 0 && (
              <p className="text-xs text-slate-500 py-4 text-center">No diagnostic suggestions generated.</p>
            )}
          </div>
        </div>
      </div>

      {/* Forecasting andCEO decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Forecasting Area Chart */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 lg:col-span-2 space-y-6 shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Predictive Revenue Forecast</h3>
            <p className="text-xs text-slate-400">Sales predictions computed via historical trend analytics</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.1)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f111a', border: '1px solid #2d2d2d', borderRadius: '8px', color: '#fff' }} />
                <Line type="monotone" dataKey="Actual" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Forecast" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CEO Actions list */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 space-y-4 shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Executive Decisions</h3>
            <p className="text-xs text-slate-400">Pending recommendations ready for execution</p>
          </div>

          <div className="space-y-3">
            {briefingData?.recommended_decisions.map((dec: any) => (
              <div 
                key={dec.id} 
                className="bg-[#12141f] border border-[#1f2937]/40 rounded-xl p-3.5 space-y-3 hover:border-indigo-500/25 transition-all"
              >
                <p className="text-xs text-slate-300 leading-normal">{dec.description}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span className="font-mono uppercase">PO-102 Protocol</span>
                  <button className="flex items-center gap-1 text-indigo-400 font-bold hover:text-indigo-300">
                    <PlayCircle className="w-3.5 h-3.5" />
                    Deploy PO
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
