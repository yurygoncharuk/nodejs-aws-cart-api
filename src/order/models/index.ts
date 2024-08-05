import { CartItem } from '../../cart/models';

export type Order = {
  id?: string;
  userId: string;
  cart_id: string;
  items: CartItem[];
  payment: {
    type: string;
    address?: any;
    creditCard?: any;
  };
  delivery: {
    type: string;
    address: any;
  };
  comments: string;
  status: string;
  total: number;
};
