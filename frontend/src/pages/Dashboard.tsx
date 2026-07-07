import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  AlertTriangle, 
  Activity, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { analyticsService } from '../services/api';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await analyticsService.getDashboardSummary();
        setSummary(data);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
      </div>
    );
  }

  const metrics = summary?.metrics || { revenue: 0, orders: 0, low_stock: 0, alerts: 0 };
  const salesData = summary?.sales_trend || [];
  const topProducts = summary?.top_products || [];
  const activity = summary?.recent_activity || [];

  const cards = [
    {
      name: 'Total Revenue',
      value: `$${metrics.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20'
    },
    {
      name: 'Total Orders',
      value: metrics.orders,
      icon: ShoppingCart,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      name: 'Low Stock Items',
      value: metrics.low_stock,
      icon: Package,
      color: metrics.low_stock > 0 ? 'text-red-400' : 'text-emerald-400',
      bgColor: metrics.low_stock > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10',
      borderColor: metrics.low_stock > 0 ? 'border-red-500/20' : 'border-emerald-500/20'
    },
    {
      name: 'System Alerts',
      value: metrics.alerts,
      icon: AlertTriangle,
      color: metrics.alerts > 0 ? 'text-amber-400' : 'text-emerald-400',
      bgColor: metrics.alerts > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10',
      borderColor: metrics.alerts > 0 ? 'border-amber-500/20' : 'border-emerald-500/20'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 via-[#121420] to-slate-900 border border-[#1f2937]/40 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-indigo-500/5 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-purple-500/5 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10 space-y-1">
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">Autonomous Operations Active</h2>
          <p className="text-slate-400 text-xs md:text-sm">Multi-agent worker systems are running diagnostics and keeping records synced.</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          Secured
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div 
            key={idx} 
            className={`glass-panel rounded-2xl p-6 border ${card.borderColor} flex items-center justify-between shadow-lg`}
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.name}</span>
              <p className="text-2xl font-bold text-white tracking-tight">{card.value}</p>
            </div>
            <div className={`p-3.5 rounded-xl ${card.bgColor} ${card.color} border border-white/5`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Revenue & Sales trends</h3>
            <p className="text-xs text-slate-400">Monthly financial performance summary analytics</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.1)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f111a', border: '1px solid #2d2d2d', borderRadius: '8px', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Area type="monotone" dataKey="Sales" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                <Area type="monotone" dataKey="Revenue" stroke="#c084fc" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Stock Bar Chart */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Top Products stock</h3>
            <p className="text-xs text-slate-400">Current stock availability of top-selling items</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(75, 85, 99, 0.1)" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis type="category" dataKey="sku" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f111a', border: '1px solid #2d2d2d', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="stock" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Timeline and Action List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Timeline */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Recent Activity Timeline</h3>
              <p className="text-xs text-slate-400">Chronological trail of AI agent automation events</p>
            </div>
            <Link to="/ai-employee" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
              Talk to Agents
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <div className="flow-root">
            <ul className="-mb-8">
              {activity.map((item: any, itemIdx: number) => (
                <li key={item.id}>
                  <div className="relative pb-8">
                    {itemIdx !== activity.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-[#1f2937]/50" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-xl flex items-center justify-center ring-4 ring-[#08090d] border border-white/5 ${
                          item.agent === 'Inventory Agent' ? 'bg-pink-500/10 text-pink-400' :
                          item.agent === 'Invoice Agent' ? 'bg-purple-500/10 text-purple-400' :
                          item.agent === 'Business Analyst' ? 'bg-emerald-500/10 text-emerald-400' :
                          'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          <Activity className="w-4 h-4" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-xs text-slate-300 font-medium">
                            <span className="font-bold text-white font-mono">[{item.agent}]</span> {item.action}
                          </p>
                        </div>
                        <div className="text-right text-[10px] whitespace-nowrap text-slate-500 font-mono">
                          {item.time.split(' ')[1]}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {activity.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No recent activity logs recorded.</p>
              )}
            </ul>
          </div>
        </div>

        {/* Top Product Table Summary */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Product Sales performance</h3>
            <p className="text-xs text-slate-400">Performance summary table</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#1f2937]/30 text-slate-400">
                  <th className="pb-3 font-semibold">SKU</th>
                  <th className="pb-3 font-semibold">Stock</th>
                  <th className="pb-3 font-semibold text-right">Price</th>
                  <th className="pb-3 font-semibold text-right">Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2937]/20">
                {topProducts.map((p: any, i: number) => (
                  <tr key={i} className="text-slate-300">
                    <td className="py-3 font-medium text-white">{p.sku}</td>
                    <td className={`py-3 ${p.stock <= 10 ? 'text-red-400 font-bold' : 'text-slate-300'}`}>{p.stock}</td>
                    <td className="py-3 text-right">${p.price.toFixed(2)}</td>
                    <td className="py-3 text-right text-indigo-400 font-bold">{p.sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
