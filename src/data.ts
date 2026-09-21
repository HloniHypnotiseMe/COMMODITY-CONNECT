import type { Commodity, Deal } from './types';

export const commodities: Commodity[] = [
  'Coal RB1','Coal RB2','Chrome 42%','Manganese','Gold 99.99%','Platinum','Palladium','Rhodium',
  'Iron Ore','Copper','Cobalt','Lithium','Diamond','Uranium','Vanadium','Titanium','Diesel 50ppm',
  'Diesel 500ppm','Petrol','Sugar ICUMSA 45','Maize','Nickel'
];

export const demoDeal: Deal = {
  id: 'demo-6-5m', reference: 'CC-DEMO-6500000', commodity: 'Coal RB1', grade: 'RB1',
  volume: 50000, unit: 'MT', unitPrice: 130, currency: 'USD', status: 'open',
  commissionPct: 3.5, protected: true
};