import React from 'react';
import { Bot, User, Database, Sparkles } from 'lucide-react';

interface AgentGraphProps {
  activeNodes: string[];
  activeEdges: { from: string; to: string }[];
}

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'agent' | 'user' | 'database';
  color: string;
}

export const AgentGraph: React.FC<AgentGraphProps> = ({ activeNodes = ["Executive Coordinator"], activeEdges = [] }) => {
  const nodes: Node[] = [
    { id: 'User', label: 'User Request', x: 250, y: 30, type: 'user', color: '#6366f1' },
    { id: 'Executive Coordinator', label: 'Executive Agent', x: 250, y: 120, type: 'agent', color: '#8b5cf6' },
    { id: 'Invoice Agent', label: 'Invoice Agent', x: 80, y: 220, type: 'agent', color: '#a78bfa' },
    { id: 'Inventory Agent', label: 'Inventory Agent', x: 420, y: 220, type: 'agent', color: '#ec4899' },
    { id: 'Business Analyst', label: 'Business Analyst', x: 120, y: 320, type: 'agent', color: '#10b981' },
    { id: 'Customer Support Agent', label: 'Customer Support', x: 380, y: 320, type: 'agent', color: '#06b6d4' },
    { id: 'Database', label: 'Central DB', x: 250, y: 240, type: 'database', color: '#f59e0b' }
  ];

  // Map nodes to coordinates for easy edge drawing
  const nodeCoords = nodes.reduce((acc, curr) => {
    acc[curr.id] = { x: curr.x, y: curr.y };
    return acc;
  }, {} as Record<string, { x: number; y: number }>);

  // Static edges definition
  const staticEdges = [
    { from: 'User', to: 'Executive Coordinator' },
    { from: 'Executive Coordinator', to: 'Invoice Agent' },
    { from: 'Executive Coordinator', to: 'Inventory Agent' },
    { from: 'Executive Coordinator', to: 'Business Analyst' },
    { from: 'Executive Coordinator', to: 'Customer Support Agent' },
    { from: 'Invoice Agent', to: 'Database' },
    { from: 'Inventory Agent', to: 'Database' },
    { from: 'Business Analyst', to: 'Database' },
    { from: 'Customer Support Agent', to: 'Database' }
  ];

  // Verify if an edge is currently active
  const isEdgeActive = (from: string, to: string) => {
    return activeEdges.some(
      (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
    ) || (activeNodes.includes(from) && activeNodes.includes(to) && (from === 'User' && to === 'Executive Coordinator'));
  };

  return (
    <div className="w-full bg-[#0d0f17] border border-[#1f2937]/50 rounded-2xl p-6 relative overflow-hidden shadow-inner">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Agent Collaboration Graph
          </h4>
          <p className="text-xs text-slate-400">Live visualization of multi-agent request delegation routing</p>
        </div>
        <div className="flex gap-4 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#8b5cf6] pulse-indigo"></div>
            <span>Active Agent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-0.5 border-t border-dashed border-slate-600"></div>
            <span>Inactive Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-0.5 border-t border-dashed border-[#8b5cf6]"></div>
            <span>Active Flow</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[500/380] max-h-[380px] bg-slate-950/40 rounded-xl border border-[#1f2937]/20 p-2">
        <svg className="w-full h-full" viewBox="0 0 500 380">
          <defs>
            {/* Gradients */}
            <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render Edges / Connections */}
          {staticEdges.map((edge, index) => {
            const start = nodeCoords[edge.from];
            const end = nodeCoords[edge.to];
            if (!start || !end) return null;
            
            const active = isEdgeActive(edge.from, edge.to);

            return (
              <g key={index}>
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={active ? 'url(#activeGrad)' : 'rgba(75, 85, 99, 0.2)'}
                  strokeWidth={active ? 2.5 : 1}
                  className={active ? 'flowing-line' : ''}
                  strokeDasharray={active ? '6,3' : 'none'}
                />
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const active = activeNodes.includes(node.id);
            
            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                {/* Active outer pulse */}
                {active && (
                  <circle
                    r={26}
                    fill="none"
                    stroke={node.color}
                    strokeWidth={2}
                    className="animate-ping opacity-25"
                  />
                )}
                
                {/* Node Main Circle */}
                <circle
                  r={20}
                  fill={active ? node.color : '#161923'}
                  stroke={active ? '#ffffff' : 'rgba(75, 85, 99, 0.4)'}
                  strokeWidth={active ? 2 : 1}
                  className="transition-colors duration-300"
                  style={active ? { filter: 'url(#glow)' } : {}}
                />

                {/* Node Icons */}
                <g transform="translate(-10, -10)">
                  {node.type === 'user' ? (
                    <User className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-500'}`} />
                  ) : node.type === 'database' ? (
                    <Database className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-500'}`} />
                  ) : (
                    <Bot className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-500'}`} />
                  )}
                </g>

                {/* Label text */}
                <text
                  y={32}
                  textAnchor="middle"
                  fill={active ? '#ffffff' : '#94a3b8'}
                  fontSize={10}
                  fontWeight={active ? 'bold' : 'normal'}
                  className="select-none font-mono"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
