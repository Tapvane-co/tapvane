"use server";

import { getShopData } from "@/lib/shop-data";
import type { ShopData } from "@/lib/shop";

// Lets the cart (which lives in the visitor's browser) ask the server for the real prices, designs and stock.
export async function loadShopData(): Promise<ShopData> {
  return getShopData();
}
