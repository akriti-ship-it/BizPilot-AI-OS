import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  ShoppingCart, 
  FilePieChart, 
  Bot, 
  TrendingUp, 
  Settings as SettingsIcon, 
  LogOut,
  Bell,
  Menu,
  X,
  Sparkles,
  Zap
} from 'lucide-react';
import { analyticsService, notificationService } from '../services/api';
import { useEffect } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ceoBriefing, setCeoBriefing] = useState<any>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [showBriefingModal, setShowBriefingModal] = useState(false);

  // Notifications states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTitle, setToastTitle] = useState<string>('');

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      const unreadCount = data.filter((n: any) => !n.read).length;
      const prevUnreadCount = notifications.filter((n: any) => !n.read).length;
      if (notifications.length > 0 && unreadCount > prevUnreadCount) {
        const latestNew = data.find((n: any) => !n.read);
        if (latestNew) {
          setToastTitle(latestNew.title);
          setToastMessage(latestNew.message);
          setTimeout(() => setToastMessage(null), 5000);
        }
      }
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [notifications.length]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      fetchNotifications();
    } catch (err) {
      console.error("Mark all read failed:", err);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      fetchNotifications();
    } catch (err) {
      console.error("Mark read failed:", err);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Reports', href: '/reports', icon: FilePieChart },
    { name: 'AI Employee', href: '/ai-employee', icon: Bot },
    { name: 'Analytics', href: '/analytics', icon: TrendingUp },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchBriefing = async () => {
    setBriefingLoading(true);
    try {
      const data = await analyticsService.getCEOBriefing();
      setCeoBriefing(data);
      setShowBriefingModal(true);
    } catch (err) {
      console.error("Failed to load CEO briefing:", err);
    } finally {
      setBriefingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-[#0c0d12] border-r border-[#1f2937]/30 z-20">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-6 border-b border-[#1f2937]/30 bg-[#0d0e13]">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Zap className="w-4 h-4 text-white fill-white/20" />
              </div>
              <span className="font-bold text-lg tracking-wider text-white">BizPilot <span className="text-indigo-400">AI OS</span></span>
            </Link>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 font-semibold shadow-inner'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-all ${
                      isActive ? 'text-indigo-400 scale-110' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User profile section */}
          <div className="flex-shrink-0 p-4 border-t border-[#1f2937]/30 bg-[#0d0e13]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-300">
                {user?.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.full_name || 'Admin User'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main workspace */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-[#08090d]/80 backdrop-blur-md border-b border-[#1f2937]/30 px-6 justify-between items-center">
          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg text-white">BizPilot AI OS</span>
          </div>

          {/* Business Info (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <span className="text-slate-400 text-sm font-medium">Business:</span>
            <span className="bg-[#12141a] px-3 py-1.5 rounded-lg border border-[#1f2937]/30 text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              {user?.business?.name || 'Java Brew Cafe'}
            </span>
            <span className="text-slate-400 text-xs px-2 py-1 bg-slate-800/50 rounded-md border border-[#1f2937]/20 uppercase tracking-widest font-mono">
              {user?.business?.type || 'Cafe'}
            </span>
          </div>

          {/* Header Action Items */}
          <div className="flex items-center gap-4">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="p-2 rounded-xl bg-[#12141a] border border-[#1f2937]/30 text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center relative active:scale-95"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter((n: any) => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#08090d]">
                    {notifications.filter((n: any) => !n.read).length}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#1f2937]/50 shadow-2xl overflow-hidden z-50" style={{ backgroundColor: '#0f111a' }}>
                  <div className="px-4 py-3 bg-[#0d0e13] border-b border-[#1f2937]/30 flex justify-between items-center">
                    <span className="font-bold text-xs text-white uppercase tracking-wider">Alert Center</span>
                    {notifications.filter((n: any) => !n.read).length > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-[#1f2937]/30">
                    {notifications.map((n: any) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs transition hover:bg-[#151722] ${
                          n.read ? 'opacity-60' : 'bg-indigo-500/5'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-slate-200">{n.title}</p>
                          {!n.read && (
                            <button
                              onClick={() => handleMarkRead(n.id)}
                              className="text-[9px] text-indigo-400 hover:text-indigo-300 font-medium"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-600 mt-1.5 font-mono">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        No alerts or notifications.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* CEO Briefing Button */}
            <button
              onClick={fetchBriefing}
              disabled={briefingLoading}
              className="relative overflow-hidden group px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all duration-200 disabled:opacity-50 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-violet-200 group-hover:rotate-12 transition-transform" />
              <span>{briefingLoading ? 'Loading Briefing...' : 'CEO Briefing'}</span>
            </button>

            {/* Health Score Gauge Badge */}
            <div 
              onClick={() => navigate('/analytics')}
              className="cursor-pointer bg-[#12141a] px-3 py-1.5 rounded-xl border border-[#1f2937]/30 flex items-center gap-2 hover:bg-[#181b24] transition-all"
              title="Operational Health Score"
            >
              <span className="text-xs text-slate-400 font-medium">Health</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${
                (user?.business?.health_score || 85) >= 80 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {user?.business?.health_score || 88}
              </span>
            </div>
          </div>
        </header>

        {/* Content container */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0c0d12] border-r border-[#1f2937]/30">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <span className="font-bold text-lg tracking-wider text-white">BizPilot AI OS</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`group flex items-center px-3 py-3 text-base font-medium rounded-xl ${
                        isActive
                          ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 font-semibold'
                          : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                      }`}
                    >
                      <item.icon className="mr-4 h-6 w-6 text-slate-400 group-hover:text-slate-200" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex-shrink-0 flex border-t border-[#1f2937]/30 p-4 bg-[#0d0e13]">
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-300">
                  U
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{user?.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
                <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-400">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CEO Briefing Modal */}
      {showBriefingModal && ceoBriefing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0f111a] border border-[#1f2937]/60 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowBriefingModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Daily CEO Executive Briefing</h3>
                <p className="text-xs text-slate-400">{ceoBriefing.briefing_date} • Prepared for {ceoBriefing.business_name}</p>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-900/60 border border-[#1f2937]/30 rounded-xl p-4">
                <p className="text-xs text-slate-400 font-medium mb-1">REVENUE (MTD)</p>
                <p className="text-xl font-bold text-indigo-400">${ceoBriefing.revenue_mtd.toFixed(2)}</p>
              </div>
              <div className="bg-slate-900/60 border border-[#1f2937]/30 rounded-xl p-4">
                <p className="text-xs text-slate-400 font-medium mb-1">RECEIVABLES</p>
                <p className="text-xl font-bold text-amber-400">${ceoBriefing.unpaid_receivables.toFixed(2)}</p>
              </div>
              <div className="bg-slate-900/60 border border-[#1f2937]/30 rounded-xl p-4">
                <p className="text-xs text-slate-400 font-medium mb-1">HEALTH SCORE</p>
                <p className="text-xl font-bold text-emerald-400">{ceoBriefing.business_health_score}/100</p>
              </div>
            </div>

            {/* Low stock alerts */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Inventory Status</h4>
              {ceoBriefing.low_stock_count > 0 ? (
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-400 mb-2">CRITICAL: {ceoBriefing.low_stock_count} items below safety limits:</p>
                  <ul className="text-xs space-y-1 text-slate-300">
                    {ceoBriefing.low_stock_items.map((item: any, i: number) => (
                      <li key={i}>• <strong>{item.name}</strong> (SKU: {item.sku}) - Stock: {item.current_stock} remaining (safety: {item.threshold})</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                  <p className="text-sm font-semibold text-emerald-400">All inventory stock levels are within safe operating limits.</p>
                </div>
              )}
            </div>

            {/* AI Agent log trail */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">AI Agent Actions Today</h4>
              <div className="bg-[#12141e] border border-[#1f2937]/30 rounded-xl p-4 space-y-3 font-mono text-xs">
                {ceoBriefing.ai_actions_today.map((action: string, i: number) => {
                  const parts = action.split(':');
                  const agentName = parts[0];
                  const details = parts.slice(1).join(':');
                  return (
                    <div key={i} className="flex items-start gap-2 border-b border-[#1f2937]/10 pb-2 last:border-0 last:pb-0">
                      <span className="text-indigo-400 font-semibold shrink-0">[{agentName}]</span>
                      <span className="text-slate-300">{details}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Recommended Actions</h4>
              <div className="space-y-3">
                {ceoBriefing.recommended_decisions.map((dec: any) => (
                  <div key={dec.id} className="flex justify-between items-center bg-[#12141e] border border-[#1f2937]/30 rounded-xl p-4 hover:border-indigo-500/20 transition-all">
                    <p className="text-sm text-slate-200">{dec.description}</p>
                    <button
                      onClick={async () => {
                        // Custom action handler
                        if (dec.action_type === 'approve_po') {
                          // Approve/Create order or trigger chat action
                          navigate('/orders');
                        } else {
                          navigate('/invoices');
                        }
                        setShowBriefingModal(false);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg active:scale-95 transition"
                    >
                      Execute
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Realtime Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-[#0f111a] border border-[#1f2937]/60 shadow-2xl p-4 flex items-start gap-3 animate-slide-in">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h4 className="font-bold text-xs text-white">{toastTitle}</h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">{toastMessage}</p>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-slate-500 hover:text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
