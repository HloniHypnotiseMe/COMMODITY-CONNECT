export type Role = 'buyer' | 'seller' | 'buyer_mandate' | 'seller_mandate' | 'facilitator' | 'intermediary';
export type DealStatus = 'open' | 'escrow_secured' | 'closed';
export type Commodity =
  | 'Coal RB1' | 'Coal RB2' | 'Chrome 42%' | 'Manganese' | 'Gold 99.99%' | 'Platinum'
  | 'Palladium' | 'Rhodium' | 'Iron Ore' | 'Copper' | 'Cobalt' | 'Lithium' | 'Diamond'
  | 'Uranium' | 'Vanadium' | 'Titanium' | 'Diesel 50ppm' | 'Diesel 500ppm' | 'Petrol'
  | 'Sugar ICUMSA 45' | 'Maize' | 'Nickel';

export interface Deal {
  id: string;
  reference: string;
  commodity: Commodity;
  grade: string;
  volume: number;
  unit: string;
  unitPrice: number;
  currency: string;
  status: DealStatus;
  commissionPct: number;
  protected: boolean;
  escrowRef?: string;
}

export interface CommissionParticipant {
  role: Role;
  name: string;
  percentage: number;
  amount: number;
  walletReady: boolean;
}