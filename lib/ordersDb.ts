import { supabase } from './supabase'

export interface OrderItem {
  menuItemId: string
  name: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  customerName: string
  tableNumber?: string
  items: OrderItem[]
  total: number
  // Flujo de estado: pending → preparing → ready → delivered
  status: 'pending' | 'preparing' | 'ready' | 'delivered'
  createdAt: string
  notes?: string
}

function toOrder(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    customerName: row.customer_name as string,
    tableNumber: row.table_number as string | undefined,
    items: (row.items as OrderItem[]) ?? [],
    total: row.total as number,
    status: row.status as Order['status'],
    createdAt: row.created_at as string,
    notes: row.notes as string | undefined,
  }
}

export async function getAllOrders(): Promise<Order[]> {
  const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
  return (data ?? []).map(toOrder)
}

export async function createOrder(data: Omit<Order, 'id' | 'createdAt' | 'status'>): Promise<Order> {
  const { data: row, error } = await supabase.from('orders').insert({
    customer_name: data.customerName,
    table_number: data.tableNumber ?? null,
    items: data.items,
    total: data.total,
    status: 'pending',
    notes: data.notes ?? null,
  }).select().single()
  if (error) throw error
  return toOrder(row)
}

export async function updateOrderStatus(id: string, status: Order['status']): Promise<Order | null> {
  const { data } = await supabase.from('orders').update({ status }).eq('id', id).select().single()
  return data ? toOrder(data) : null
}

// Actualiza campos editables de un pedido ya creado (p. ej. clasificarlo como
// domicilio tras enviarlo: notes con prefijo [DOMICILIO] + dirección, y limpiar mesa).
export async function updateOrderFields(
  id: string,
  fields: { notes?: string; tableNumber?: string; customerName?: string },
): Promise<Order | null> {
  const payload: Record<string, unknown> = {}
  if (fields.notes !== undefined)        payload.notes = fields.notes
  if (fields.tableNumber !== undefined)  payload.table_number = fields.tableNumber || null
  if (fields.customerName !== undefined) payload.customer_name = fields.customerName
  const { data } = await supabase.from('orders').update(payload).eq('id', id).select().single()
  return data ? toOrder(data) : null
}
