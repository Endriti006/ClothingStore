import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
};

const STORAGE_KEY = 'bolt_store_cart';
const SESSION_KEY = 'bolt_store_cart_session';

type CartRow = {
  id: string;
};

type CartItemRow = {
  product_id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
};

function isSameCartLine(
  item: Pick<CartItem, 'productId' | 'size' | 'color'>,
  productId: string,
  size: string,
  color: string
) {
  return item.productId === productId && item.size === size && item.color === color;
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

let cart: CartItem[] = loadCart();
const listeners = new Set<() => void>();
let remoteHydrationStarted = false;
let syncInProgress = false;
let cartVersion = 0;
let syncedVersion = -1;

function createSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(SESSION_KEY, generated);
    return generated;
  } catch {
    return 'guest-session';
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function persistLocal(notify = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  if (notify) emit();
}

async function upsertRemote(snapshot: CartItem[]) {
  const sessionId = createSessionId();

  const { data: cartData, error: cartError } = await supabase
    .from('carts')
    .upsert({ session_id: sessionId }, { onConflict: 'session_id' })
    .select('id')
    .single();

  if (cartError) throw cartError;

  const cartId = (cartData as CartRow).id;

  const { error: deleteError } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cartId);
  if (deleteError) throw deleteError;

  if (snapshot.length === 0) return;

  const rows = snapshot.map((item) => ({
    cart_id: cartId,
    product_id: item.productId,
    slug: item.slug,
    name: item.name,
    price: item.price,
    image: item.image,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
  }));

  const { error: insertError } = await supabase.from('cart_items').insert(rows);
  if (insertError) throw insertError;
}

function queueRemoteSync() {
  if (syncInProgress) return;
  syncInProgress = true;

  void (async () => {
    while (syncedVersion < cartVersion) {
      const targetVersion = cartVersion;
      const snapshot = [...cart];
      try {
        await upsertRemote(snapshot);
        syncedVersion = targetVersion;
      } catch (error) {
        console.error('Cart sync failed', error);
        break;
      }
    }
    syncInProgress = false;
  })();
}

function persist() {
  cartVersion += 1;
  persistLocal(true);
  queueRemoteSync();
}

async function hydrateRemoteCart() {
  if (remoteHydrationStarted) return;
  remoteHydrationStarted = true;

  try {
    const sessionId = createSessionId();
    const { data: cartData, error: cartError } = await supabase
      .from('carts')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (cartError) throw cartError;
    if (!cartData) {
      if (cart.length > 0) queueRemoteSync();
      return;
    }

    const { data: itemRows, error: itemError } = await supabase
      .from('cart_items')
      .select('product_id, slug, name, price, image, size, color, quantity')
      .eq('cart_id', (cartData as CartRow).id);

    if (itemError) throw itemError;

    const remoteItems = ((itemRows ?? []) as CartItemRow[]).map((row) => ({
      productId: row.product_id,
      slug: row.slug,
      name: row.name,
      price: row.price,
      image: row.image,
      size: row.size,
      color: row.color,
      quantity: row.quantity,
    }));

    if (remoteItems.length > 0) {
      cart = remoteItems;
      persistLocal(false);
      emit();
      syncedVersion = cartVersion;
      return;
    }

    if (cart.length > 0) queueRemoteSync();
  } catch (error) {
    console.error('Cart hydration failed', error);
  }
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1) {
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const idx = cart.findIndex((i) => isSameCartLine(i, item.productId, item.size, item.color));
  if (idx >= 0) {
    cart = cart.map((i, k) => (k === idx ? { ...i, quantity: i.quantity + safeQuantity } : i));
  } else {
    cart = [...cart, { ...item, quantity: safeQuantity }];
  }
  persist();
}

export function updateQuantity(productId: string, size: string, color: string, quantity: number) {
  const safeQuantity = Math.floor(quantity);
  if (safeQuantity <= 0) {
    removeFromCart(productId, size, color);
    return;
  }
  cart = cart.map((i) =>
    isSameCartLine(i, productId, size, color)
      ? { ...i, quantity: safeQuantity }
      : i
  );
  persist();
}

export function getCartLineQuantity(productId: string, size: string, color: string): number {
  return cart
    .filter((i) => isSameCartLine(i, productId, size, color))
    .reduce((sum, i) => sum + i.quantity, 0);
}

export function removeFromCart(productId: string, size: string, color: string) {
  cart = cart.filter((i) => !isSameCartLine(i, productId, size, color));
  persist();
}

export function clearCart() {
  cart = [];
  persist();
}

export function getCart(): CartItem[] {
  return cart;
}

export function cartCount(): number {
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartSubtotal(): number {
  return cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function useCart() {
  const [, setTick] = useState(0);
  useEffect(() => {
    void hydrateRemoteCart();
    const l = () => setTick((t) => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return cart;
}

export function useCartCount() {
  const [count, setCount] = useState(() => cartCount());
  useEffect(() => {
    void hydrateRemoteCart();
    const l = () => setCount(cartCount());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return count;
}

export function useAddToCart() {
  return useCallback((item: Omit<CartItem, 'quantity'>, quantity?: number) => addToCart(item, quantity), []);
}
