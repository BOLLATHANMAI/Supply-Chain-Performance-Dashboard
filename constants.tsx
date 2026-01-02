
import { Shipment } from './types';

export const CARRIERS = ['SwiftLogistics', 'GlobalExpress', 'FreightFlow', 'OceanicBridge', 'RapidRoads'];
export const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
export const TRANSPORT_MODES = ['Air', 'Road', 'Rail', 'Sea'] as const;

const generateMockData = (): Shipment[] => {
  const shipments: Shipment[] = [];
  const now = new Date();

  for (let i = 0; i < 250; i++) {
    const transportMode = TRANSPORT_MODES[Math.floor(Math.random() * TRANSPORT_MODES.length)];
    
    // Logic: Air is fast but pricey, Sea is slow but cheap, Road is middle-ground but prone to delays
    let baseEst = 3;
    let delayChance = 0.2;
    let costMultiplier = 0.5;

    switch(transportMode) {
      case 'Air': baseEst = 2; delayChance = 0.1; costMultiplier = 2.5; break;
      case 'Sea': baseEst = 14; delayChance = 0.3; costMultiplier = 0.2; break;
      case 'Rail': baseEst = 7; delayChance = 0.25; costMultiplier = 0.4; break;
      case 'Road': baseEst = 4; delayChance = 0.4; costMultiplier = 0.8; break;
    }

    const est = baseEst;
    const isDelayed = Math.random() < delayChance;
    const actual = est + (isDelayed ? Math.floor(Math.random() * 5) + 1 : 0);
    const delay = actual - est;
    const weight = Math.floor(Math.random() * 5000) + 100;
    const cost = (weight * costMultiplier) + (delay * 150) + (Math.random() * 300);

    const date = new Date(now.getTime() - (Math.random() * 45 * 24 * 60 * 60 * 1000));

    shipments.push({
      id: `SHP-${1000 + i}`,
      date: date.toISOString().split('T')[0],
      origin: REGIONS[Math.floor(Math.random() * REGIONS.length)],
      destination: REGIONS[Math.floor(Math.random() * REGIONS.length)],
      carrier: CARRIERS[Math.floor(Math.random() * CARRIERS.length)],
      transportMode: transportMode as any,
      estimatedDays: est,
      actualDays: actual,
      delay: delay,
      freightCost: cost,
      weight: weight,
      status: delay > 0 ? 'Delayed' : 'Delivered',
      priority: Math.random() > 0.8 ? 'High' : (Math.random() > 0.5 ? 'Medium' : 'Low'),
    });
  }
  return shipments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const MOCK_SHIPMENTS = generateMockData();

export const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
