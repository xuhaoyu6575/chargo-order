import React, { useState } from 'react';
import OperationsDashboard from './pages/OperationsDashboard';
import RevenueCockpit from './revenue/RevenueCockpit';

export default function App() {
  const [tab, setTab] = useState('ops');

  return (
    <div className="min-h-screen bg-[#06162d]">
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-center gap-1 border-b border-slate-800/80 bg-[#050d1a]/95 px-4 backdrop-blur-sm">
        <div className="flex max-w-3xl flex-1 rounded-lg border border-slate-700/50 bg-slate-900/40 p-1">
          <button
            type="button"
            onClick={() => setTab('ops')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === 'ops'
                ? 'bg-cyan-950/80 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            运营看板
          </button>
          <button
            type="button"
            onClick={() => setTab('revenue')}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === 'revenue'
                ? 'bg-amber-950/50 text-amber-200 shadow-[0_0_14px_rgba(212,168,83,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            营收分析驾驶舱
          </button>
        </div>
      </nav>

      <main className="pt-14">
        {tab === 'ops' ? <OperationsDashboard /> : <RevenueCockpit />}
      </main>
    </div>
  );
}
