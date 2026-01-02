
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend }) => {
  return (
    <div className="bg-white p-4 rounded-sm border border-[#D2D2D2] shadow-sm flex flex-col items-center justify-center transition-all hover:border-indigo-400 group relative overflow-hidden h-24">
      {/* Power BI Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-transparent group-hover:bg-indigo-500 transition-all"></div>
      
      <div className="text-[#605E5C] text-[9px] font-black uppercase tracking-widest mb-1 text-center select-none">
        {label}
      </div>
      
      <div className="text-2xl font-black text-[#1B1B1B] leading-none mb-1 group-hover:text-indigo-700 transition-colors drop-shadow-sm">
        {value}
      </div>

      {trend ? (
        <div className={`text-[9px] font-black flex items-center gap-0.5 ${trend.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
          <span className="text-[8px]">{trend.isUp ? '▲' : '▼'}</span>
          <span>{Math.abs(trend.value)}% VS PREV</span>
        </div>
      ) : (
        <div className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter">Measure (DAX)</div>
      )}
    </div>
  );
};
