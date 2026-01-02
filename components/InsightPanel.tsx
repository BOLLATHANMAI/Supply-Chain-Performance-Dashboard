
import React from 'react';
import { InsightReport } from '../types';

interface InsightPanelProps {
  report: InsightReport | null;
  loading: boolean;
}

export const InsightPanel: React.FC<InsightPanelProps> = ({ report, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-4 rounded-sm border border-[#D2D2D2] shadow-sm animate-pulse flex flex-col gap-2">
        <div className="h-2 bg-slate-200 rounded w-1/6"></div>
        <div className="h-4 bg-slate-100 rounded w-3/4"></div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="bg-[#252423] p-4 rounded-sm text-white shadow-md border-l-4 border-indigo-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-1 bg-indigo-600 rounded">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path></svg>
        </div>
        <h2 className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Smart Narrative Insights</h2>
      </div>
      
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <p className="text-slate-200 text-xs leading-relaxed font-medium">
            {report.summary}
          </p>
        </div>
        <div className="col-span-12 lg:col-span-4 flex items-center justify-end">
          <div className="flex gap-2">
            <div className="px-2 py-1 bg-rose-900/40 border border-rose-800 rounded text-[9px] font-bold text-rose-200">
               ⚠️ {report.keyInefficiencies[0]}
            </div>
            <div className="px-2 py-1 bg-emerald-900/40 border border-emerald-800 rounded text-[9px] font-bold text-emerald-200">
               🎯 {report.recommendations[0]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
