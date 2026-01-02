
export interface Shipment {
  id: string;
  date: string;
  origin: string;
  destination: string;
  carrier: string;
  transportMode: 'Air' | 'Road' | 'Rail' | 'Sea';
  estimatedDays: number;
  actualDays: number;
  delay: number;
  freightCost: number;
  weight: number;
  status: 'Delivered' | 'Delayed' | 'In Transit';
  priority: 'High' | 'Medium' | 'Low';
}

export interface AggregatedStats {
  totalShipments: number;
  totalFreightCost: number;
  avgDelay: number;
  onTimeDeliveryRate: number;
  delayedCount: number;
  totalWeight: number;
  costPerKg: number;
}

export interface InsightReport {
  summary: string;
  keyInefficiencies: string[];
  recommendations: string[];
}
