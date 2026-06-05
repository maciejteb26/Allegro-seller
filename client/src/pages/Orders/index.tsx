import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { Platform } from '@/types';

type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
interface Order {
  id: string;
  platform: Platform;
  externalOrderId: string;
  listingTitle: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  buyerName: string;
  createdAt: string;
  externalUrl: string;
}

async function getOrders(): Promise<Order[]> {
  const { data } = await apiClient.get<Order[]>('/orders');
  return data;
}

export default function OrdersPage() {
  const [platform, setPlatform] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  const { data = [] } = useQuery({ queryKey: ['orders'], queryFn: getOrders });

  const filtered = useMemo(
    () =>
      data.filter(
        (order) => (platform === 'ALL' || order.platform === platform) && (status === 'ALL' || order.status === status),
      ),
    [data, platform, status],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Zamowienia</h1>
      <div className="flex gap-2">
        <select className="rounded border px-2 py-1" value={platform} onChange={(e) => setPlatform(e.target.value)}>
          <option value="ALL">Wszystkie</option>
          <option value="ALLEGRO">Allegro</option>
        </select>
        <select className="rounded border px-2 py-1" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">Wszystkie statusy</option>
          <option value="PENDING">PENDING</option>
          <option value="PAID">PAID</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="p-3">Platforma</th>
              <th className="p-3">Numer</th>
              <th className="p-3">Czesc</th>
              <th className="p-3">Kwota</th>
              <th className="p-3">Status</th>
              <th className="p-3">Data</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} className="border-b">
                <td className="p-3">{order.platform}</td>
                <td className="p-3">{order.externalOrderId}</td>
                <td className="p-3">{order.listingTitle}</td>
                <td className="p-3">
                  {order.amount} {order.currency}
                </td>
                <td className="p-3">{order.status}</td>
                <td className="p-3">{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-6 text-center text-sm text-gray-500">Brak zamowien</div>}
      </div>
    </div>
  );
}
