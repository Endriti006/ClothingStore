import { supabase } from './supabase';
import type { Order } from '../types';

export async function fetchAdminOrders(limit = 200): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, session_id, status, payment_method, payment_type, total_amount, currency, shipping_info, line_items')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Order[];
}