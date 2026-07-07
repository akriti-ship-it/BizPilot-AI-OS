import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08090d] flex items-center justify-center p-6">
      <div className="glass-panel max-w-md w-full rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <HelpCircle className="w-8 h-8" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-white mb-2 font-mono">404</h1>
        <h2 className="text-xl font-bold text-slate-200 mb-4">Pilot Error: Destination Not Found</h2>
        
        <p className="text-slate-400 text-sm mb-8">
          The coordinate grid for this workspace has returned an empty pointer. You might have clicked a broken link or the path was updated by the AI coordinator.
        </p>
        
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to OS Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
