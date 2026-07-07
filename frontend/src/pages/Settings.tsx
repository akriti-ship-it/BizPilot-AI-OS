import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/api';
import { Save, User, Shield, Briefcase, Eye, EyeOff, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  
  // States
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_key_bizpilot') || '');
  const [showKey, setShowKey] = useState(false);
  const [businessName, setBusinessName] = useState(user?.business?.name || 'Java Brew Cafe');
  const [businessType, setBusinessType] = useState(user?.business?.type || 'Cafe');
  const [success, setSuccess] = useState('');

  // OpenAI Key Verification States
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');

  const handleVerifyConnection = async () => {
    if (!apiKey) {
      setVerificationError('Please enter an OpenAI API key first.');
      return;
    }
    setVerifying(true);
    setVerificationError('');
    setVerificationSuccess('');
    
    // Temporarily persist so the request interceptor forwards it in headers
    localStorage.setItem('openai_key_bizpilot', apiKey);
    
    try {
      const res = await authService.testOpenAIKey();
      if (res.status === 'success') {
        setVerificationSuccess('API Connection verified successfully! OpenAI models are online.');
      } else {
        setVerificationError('Validation returned unexpected response.');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.detail || 'OpenAI Key verification failed. Please check your credentials.';
      setVerificationError(errMsg);
      localStorage.removeItem('openai_key_bizpilot');
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    
    // Save OpenAI key locally for client-side reference or to let user test
    if (apiKey) {
      localStorage.setItem('openai_key_bizpilot', apiKey);
    } else {
      localStorage.removeItem('openai_key_bizpilot');
    }
    
    setSuccess("Settings updated successfully!");
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">System Settings</h2>
        <p className="text-xs md:text-sm text-slate-400">Configure business operations, developer keys, and client parameters</p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl flex items-start gap-2 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Business Configurations */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-[#1f2937]/15 pb-3">
            <Briefcase className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Business Identity</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Company/Cafe Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Business Category Type</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-slate-900 border border-[#1f2937] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Cafe">Cafe / Restaurant</option>
                <option value="Retail">Retail Store</option>
                <option value="SaaS">SaaS Platform</option>
                <option value="General">General Business</option>
              </select>
            </div>
          </div>
        </div>

        {/* Developer / AI Credentials */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-[#1f2937]/15 pb-3">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">AI API Credentials</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            BizPilot OS includes an integrated fallback agent simulation engine. To run real API tasks, enter your API key below. Keys are stored safely in local memory.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">OpenAI API Key</label>
            <div className="flex gap-3">
              <div className="relative rounded-md shadow-sm flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-900 border border-[#1f2937] rounded-xl pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  placeholder="sk-..."
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              <button
                type="button"
                onClick={handleVerifyConnection}
                disabled={verifying}
                className="px-4 py-2 bg-slate-900 border border-[#1f2937]/50 hover:bg-[#181b24] disabled:opacity-50 text-indigo-400 hover:text-indigo-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition active:scale-95 duration-150"
              >
                {verifying ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Verify Connection</span>
                )}
              </button>
            </div>

            {verificationError && (
              <div className="mt-2.5 text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}

            {verificationSuccess && (
              <div className="mt-2.5 text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{verificationSuccess}</span>
              </div>
            )}
          </div>
        </div>

        {/* Theme and Preferences */}
        <div className="glass-panel rounded-2xl p-6 border border-[#1f2937]/30 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 border-b border-[#1f2937]/15 pb-3">
            <User className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">OS Settings</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-200">Force Dark Mode</p>
              <p className="text-[10px] text-slate-500">Enable premium glassmorphism layouts</p>
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                darkMode ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  darkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
