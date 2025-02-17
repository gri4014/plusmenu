export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
  INACTIVE = 'inactive'
}

export interface ITable {
  id: string;
  restaurant_id: string;
  table_number: number | null;
  status: TableStatus;
  qr_code_identifier: string;
  qr_code_image_path: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}
