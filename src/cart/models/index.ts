export enum CartStatuses {
  OPEN = 'OPEN',
  STATUS = 'STATUS',
}

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
};

export type CartItem = {
  cart_id: string;
  product_id: string;
  count: number;
  price: number;
};

export type Cart = {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: CartStatuses;
  items: CartItem[];
};
