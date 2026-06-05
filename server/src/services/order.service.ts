import { Platform } from '@prisma/client';

export interface Order {
  id: string;
  platform: Platform;
  externalOrderId: string;
  listingTitle: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  buyerName: string;
  createdAt: string;
  externalUrl: string;
}

export async function getOrders(_userId: string): Promise<Order[]> {
  const now = new Date().toISOString();
  return [
    {
      id: 'mock-order-1',
      platform: 'ALLEGRO',
      externalOrderId: 'ALG-10001',
      listingTitle: 'Lampa tylna Suzuki Samurai 1990 prawa',
      amount: 249.99,
      currency: 'PLN',
      status: 'PAID',
      buyerName: 'Jan Kowalski',
      createdAt: now,
      externalUrl: 'https://allegro.pl/zamowienie/mock-1',
    },
  ];
}
