
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell, Legend
} from 'recharts';
import { MOCK_SHIPMENTS, CARRIERS, REGIONS, TRANSPORT_MODES, CHART_COLORS } from './constants';
import { Shipment, InsightReport } from './types';
import { StatCard } from './components/StatCard';
import { InsightPanel } from './components/InsightPanel';
import { analyzeSupplyChainData } from './services/geminiService';

type ActivePage = 'Executive View' | 'Deep Dive Analysis' | 'Data Ledger';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<ActivePage>('Executive View');
  const [selectedCarrier, setSelectedCarrier] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedMode, setSelectedMode] = useState<string>('All');
  const [isFilterPaneOpen, setIsFilterPaneOpen] = useState(true);
  
  const [insightReport, setInsightReport] = useState<InsightReport | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Filtered Data (Slicer logic)
  const filteredData = useMemo(() => {
    return MOCK_SHIPMENTS.filter(s => 
      (selectedCarrier === 'All' || s.carrier === selectedCarrier) &&
      (selectedRegion === 'All' || s.origin === selectedRegion || s.destination === selectedRegion) &&
      (selectedMode === 'All' || s.transportMode === selectedMode)
    );
  }, [selectedCarrier, selectedRegion, selectedMode]);

  // DAX Measures Implementation
  const measures = useMemo(() => {
    const totalFreightCost = filteredData.reduce((acc, s) => acc + s.freightCost, 0);
    const totalDelay = filteredData.reduce((acc, s) => acc + s.delay, 0);
    const delayedShipmentsCount = filteredData.filter(s => s.delay > 0).length;
    const onTimePercentage = filteredData.length > 0 
      ? Math.round(((filteredData.length - delayedShipmentsCount) / filteredData.length) * 100) 
      : 0;

    return {
      totalFreightCost,
      avgDeliveryDelay: filteredData.length > 0 ? (totalDelay / filteredData.length).toFixed(1) : "0.0",
      onTimeDeliveryPercent: onTimePercentage,
      delayedShipments: delayedShipmentsCount
    };
  }, [filteredData]);

  // Visual: Delay by Transport Mode
  const delayByMode = useMemo(() => {
    const data: Record<string, { total: number, count: number }> = {};
    filteredData.forEach(s => {
      if (!data[s.transportMode]) data[s.transportMode] = { total: 0, count: 0 };
      data[s.transportMode].total += s.delay;
      data[s.transportMode].count += 1;
    });
    return Object.entries(data).map(([name, val]) => ({ 
      name, 
      avgDelay: parseFloat((val.total / val.count).toFixed(2)) 
    })).sort((a, b) => b.avgDelay - a.avgDelay);
  }, [filteredData]);

  // Visual: Delay by Vendor
  const delayByVendor = useMemo(() => {
    const data: Record<string, { total: number, count: number }> = {};
    filteredData.forEach(s => {
      if (!data[s.carrier]) data[s.carrier] = { total: 0, count: 0 };
      data[s.carrier].total += s.delay;
      data[s.carrier].count += 1;
    });
    return Object.entries(data).map(([name, val]) => ({ 
      name, 
      avgDelay: parseFloat((val.total / val.count).toFixed(2)) 
    })).sort((a, b) => b.avgDelay - a.avgDelay);
  }, [filteredData]);

  // Visual: Cost by Transport Mode
  const costByMode = useMemo(() => {
    const data: Record<string, number> = {};
    filteredData.forEach(s => {
      data[s.transportMode] = (data[s.transportMode] || 0) + s.freightCost;
    });
    return Object.entries(data).map(([name, cost]) => ({ name, cost: Math.round(cost) }));
  }, [filteredData]);

  // Visual: Cost by Vendor
  const costByVendor = useMemo(() => {
    const data: Record<string, number> = {};
    filteredData.forEach(s => {
      data[s.carrier] = (data[s.carrier] || 0) + s.freightCost;
    });
    return Object.entries(data).map(([name, cost]) => ({ name, cost: Math.round(cost) }));
  }, [filteredData]);

  // Scatter Data
  const scatterData = useMemo(() => {
    return filteredData.map(s => ({
      cost: s.freightCost,
      delay: s.delay,
      weight: s.weight,
      id: s.id,
      mode: s.transportMode
    }));
  }, [filteredData]);

  useEffect(() => {
    const getInsights = async () => {
      if (filteredData.length === 0) return;
      setLoadingInsights(true);
      const report = await analyzeSupplyChainData(filteredData);
      setInsightReport(report);
      setLoadingInsights(false);
    };
    getInsights();
  }, [selectedCarrier, selectedRegion, selectedMode]);

  return (
    <div className="flex h-screen bg-[#F3F2F1] text-slate-800 overflow-hidden font-sans">
      {/* Power BI Sidebar Icons */}
      <nav className="w-12 bg-[#252423] flex flex-col items-center py-4 gap-6 text-white shrink-0 shadow-xl">
        <div className="w-8 h-8 bg-[#F2C811] rounded-sm flex items-center justify-center text-black font-black text-sm select-none">Pb</div>
        <button onClick={() => setActivePage('Executive View')} className={`p-2 rounded transition-all ${activePage === 'Executive View' ? 'bg-[#3C3C3B]' : 'opacity-60 hover:opacity-100 hover:bg-[#3C3C3B]'}`} title="Report View">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
        </button>
        <button onClick={() => setActivePage('Deep Dive Analysis')} className={`p-2 rounded transition-all ${activePage === 'Deep Dive Analysis' ? 'bg-[#3C3C3B]' : 'opacity-60 hover:opacity-100 hover:bg-[#3C3C3B]'}`} title="Analytics View">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>
        <button onClick={() => setActivePage('Data Ledger')} className={`p-2 rounded transition-all ${activePage === 'Data Ledger' ? 'bg-[#3C3C3B]' : 'opacity-60 hover:opacity-100 hover:bg-[#3C3C3B]'}`} title="Data View">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
        </button>
      </nav>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Ribbon Header */}
        <header className="h-10 bg-white border-b border-[#D2D2D2] flex items-center px-4 justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-6">
            <span className="text-xs font-bold text-[#1B1B1B] border-r border-slate-300 pr-4">Power BI Dashboard</span>
            <div className="flex gap-4">
              <button className="text-[11px] font-medium text-slate-600 hover:text-indigo-600">Home</button>
              <button className="text-[11px] font-medium text-slate-600 hover:text-indigo-600">Insert</button>
              <button className="text-[11px] font-medium text-slate-600 hover:text-indigo-600">Modeling</button>
              <button className="text-[11px] font-medium text-slate-600 hover:text-indigo-600">View</button>
            </div>
          </div>
          <div className="text-[11px] font-bold text-slate-400">Logistics_Performance_v1.pbix</div>
        </header>

        {/* Report Canvas & Filter Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Visual Canvas */}
          <main className="flex-1 overflow-y-auto p-4 scrollbar-hide bg-[#EAEAEA]">
            <div className="max-w-[1500px] mx-auto space-y-4">
              
              {/* Report Pages Footer Style Tab switcher */}
              <div className="flex gap-1 border-b border-[#D2D2D2] mb-4 bg-white/50 p-1 rounded-sm">
                {(['Executive View', 'Deep Dive Analysis', 'Data Ledger'] as ActivePage[]).map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActivePage(tab)}
                    className={`px-3 py-1.5 text-[11px] font-bold transition-all rounded-sm ${activePage === tab ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Page Content: Executive View (The User's Requested Layout) */}
              {activePage === 'Executive View' && (
                <div className="grid grid-cols-12 gap-4 animate-in fade-in duration-500">
                  
                  {/* AI Insight Header (Dynamic AI summary) */}
                  <div className="col-span-12">
                     <InsightPanel report={insightReport} loading={loadingInsights} />
                  </div>

                  {/* 1️⃣ TOP ROW – KPI CARDS */}
                  <div className="col-span-12 grid grid-cols-4 gap-4">
                    <StatCard label="Avg Delivery Delay" value={`${measures.avgDeliveryDelay}d`} icon={<svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} />
                    <StatCard label="Total Freight Cost" value={`$${Math.round(measures.totalFreightCost).toLocaleString()}`} icon={<svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m.599-1c1.025-.505 1.401-1.282 1.401-2s-.376-1.495-1.401-2M12 16c-1.11 0-2.08-.402-2.599-1M12 16v1m0-1v-8m0 0v-1m-.599 1c-1.025.505-1.401 1.282-1.401 2s.376 1.495 1.401 2"></path></svg>} />
                    <StatCard label="On-Time Delivery %" value={`${measures.onTimeDeliveryPercent}%`} icon={<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>} />
                    <StatCard label="Delayed Shipments" value={measures.delayedShipments} icon={<svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>} />
                  </div>

                  {/* 2️⃣ MIDDLE ROW – Delivery Delay Analysis */}
                  <div className="col-span-12 grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-sm border border-[#D2D2D2] shadow-sm">
                      <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-wider">Delivery Delay by Transport Mode</h3>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={delayByMode}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#F8F8F8' }} />
                            <Bar dataKey="avgDelay" fill="#12239E" radius={[2, 2, 0, 0]} barSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-sm border border-[#D2D2D2] shadow-sm">
                      <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-wider">Delay by Vendor (Avg Days)</h3>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={delayByVendor} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F0F0F0" />
                            <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="avgDelay" fill="#E66C37" radius={[0, 2, 2, 0]} barSize={16} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* 3️⃣ NEXT ROW – Freight Cost Analysis */}
                  <div className="col-span-12 grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-sm border border-[#D2D2D2] shadow-sm">
                      <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-wider">Total Freight Cost by Mode</h3>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={costByMode}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} />
                            <YAxis tick={{ fontSize: 10 }} axisLine={false} />
                            <Tooltip />
                            <Bar dataKey="cost" fill="#118DFF" radius={[2, 2, 0, 0]} barSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-sm border border-[#D2D2D2] shadow-sm">
                      <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-wider">Total Freight Cost by Vendor</h3>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={costByVendor} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="cost" fill="#00A2AD" radius={[0, 2, 2, 0]} barSize={16} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* 4️⃣ BOTTOM – Cost vs Delay Relationship (Scatter) */}
                  <div className="col-span-12">
                    <div className="bg-white p-4 rounded-sm border border-[#D2D2D2] shadow-sm h-[400px]">
                      <h3 className="text-[10px] font-bold uppercase text-slate-400 mb-3 tracking-wider">Inefficiency Scatter: Freight Cost vs Delivery Delay</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                          <XAxis type="number" dataKey="cost" name="Cost" unit="$" label={{ value: 'Freight Cost ($)', position: 'insideBottom', offset: -10, fontSize: 10 }} />
                          <YAxis type="number" dataKey="delay" name="Delay" unit="d" label={{ value: 'Delay (Days)', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                          <ZAxis type="number" dataKey="weight" range={[50, 400]} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Legend verticalAlign="top" height={36}/>
                          <Scatter name="Shipment Efficiency" data={scatterData}>
                            {scatterData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.delay > 2 ? '#E01E26' : (entry.delay > 0 ? '#F9B700' : '#00A15E')} fillOpacity={0.6} />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Page Content: Deep Dive */}
              {activePage === 'Deep Dive Analysis' && (
                <div className="bg-white border border-[#D2D2D2] p-8 min-h-[600px] flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <svg className="w-16 h-16 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                    <p className="text-slate-500 font-medium">Drill-down analytics page is pre-calculating...</p>
                    <p className="text-xs text-slate-400">Use the Executive View for current tactical overview.</p>
                  </div>
                </div>
              )}

              {/* Page Content: Data Ledger */}
              {activePage === 'Data Ledger' && (
                <div className="bg-white border border-[#D2D2D2] overflow-hidden rounded-sm shadow-sm">
                   <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#F8F8F8] text-slate-500 font-bold border-b border-[#D2D2D2]">
                        <tr>
                          <th className="px-4 py-3">ORDER_ID</th>
                          <th className="px-4 py-3">DATE</th>
                          <th className="px-4 py-3">VENDOR</th>
                          <th className="px-4 py-3">MODE</th>
                          <th className="px-4 py-3 text-right">FREIGHT_COST</th>
                          <th className="px-4 py-3 text-right">DELIVERY_DELAY</th>
                          <th className="px-4 py-3">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0F0F0]">
                        {filteredData.slice(0, 100).map(s => (
                          <tr key={s.id} className="hover:bg-indigo-50/50 transition-colors">
                            <td className="px-4 py-2 font-semibold text-indigo-600">{s.id}</td>
                            <td className="px-4 py-2">{s.date}</td>
                            <td className="px-4 py-2 font-medium">{s.carrier}</td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[9px] font-bold text-slate-600">{s.transportMode}</span>
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-slate-800">${Math.round(s.freightCost).toLocaleString()}</td>
                            <td className={`px-4 py-2 text-right font-bold ${s.delay > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {s.delay > 0 ? `+${s.delay}d` : '0'}
                            </td>
                            <td className="px-4 py-2">
                               <div className="flex items-center gap-1.5">
                                 <span className={`w-1.5 h-1.5 rounded-full ${s.delay > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                 <span className="font-semibold text-slate-600 uppercase text-[9px]">{s.status}</span>
                               </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* Right Slicer Panel (Filters) */}
          <aside className={`bg-white border-l border-[#D2D2D2] transition-all duration-300 shrink-0 shadow-2xl z-20 ${isFilterPaneOpen ? 'w-[280px]' : 'w-10'}`}>
            <div className="flex h-full flex-col">
              <button 
                onClick={() => setIsFilterPaneOpen(!isFilterPaneOpen)}
                className="h-10 border-b border-[#D2D2D2] flex items-center justify-center hover:bg-slate-50 transition-colors"
                title={isFilterPaneOpen ? "Close Filters" : "Open Filters"}
              >
                <svg className={`w-4 h-4 transition-transform ${isFilterPaneOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              
              {isFilterPaneOpen && (
                <div className="p-5 space-y-8 overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h2 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Filters / Slicers</h2>
                    <button 
                      onClick={() => {
                        setSelectedCarrier('All');
                        setSelectedMode('All');
                        setSelectedRegion('All');
                      }}
                      className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Clear all
                    </button>
                  </div>
                  
                  {/* Slicer: Vendor */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Logistics Vendor</label>
                    <select 
                      value={selectedCarrier}
                      onChange={(e) => setSelectedCarrier(e.target.value)}
                      className="w-full text-xs border border-[#D2D2D2] p-2.5 rounded shadow-sm focus:border-indigo-500 outline-none appearance-none bg-no-repeat bg-[right_10px_center] bg-[length:10px]"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")' }}
                    >
                      <option value="All">Select All</option>
                      {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Slicer: Transport Mode */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Transport Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setSelectedMode('All')}
                        className={`text-[10px] font-bold px-2 py-2 rounded transition-all border ${selectedMode === 'All' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                      >
                        ALL
                      </button>
                      {TRANSPORT_MODES.map(mode => (
                        <button 
                          key={mode}
                          onClick={() => setSelectedMode(mode)}
                          className={`text-[10px] font-bold px-2 py-2 rounded transition-all border ${selectedMode === mode ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                        >
                          {mode.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Slicer: Region */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Region (Origin / Dest)</label>
                    <div className="space-y-1.5">
                      {['All', ...REGIONS].map(r => (
                         <div key={r} className="flex items-center gap-2 group cursor-pointer" onClick={() => setSelectedRegion(r)}>
                           <div className={`w-3.5 h-3.5 rounded-sm border transition-colors ${selectedRegion === r ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                             {selectedRegion === r && (
                               <svg className="w-full h-full text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                             )}
                           </div>
                           <span className={`text-[11px] font-medium ${selectedRegion === r ? 'text-indigo-700 font-bold' : 'text-slate-600'}`}>{r}</span>
                         </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Metric below filters */}
                  <div className="pt-8 border-t border-slate-100">
                    <div className="bg-indigo-50 p-4 rounded-sm">
                      <p className="text-[9px] font-bold text-indigo-400 uppercase mb-1">Items Filtered</p>
                      <p className="text-xl font-black text-indigo-900">{filteredData.length}</p>
                      <p className="text-[9px] text-indigo-500 mt-1 italic">Update live on slicer change</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default App;
