import type { Database } from './database.types'

type Public = Database['public']

/** Row type of any table or view, e.g. `Row<'products'>`, `Row<'v_product_stock'>`. */
export type Row<T extends keyof (Public['Tables'] & Public['Views'])> =
  (Public['Tables'] & Public['Views'])[T] extends { Row: infer R } ? R : never

/** Insert payload for a table, e.g. `Insert<'products'>`. */
export type Insert<T extends keyof Public['Tables']> = Public['Tables'][T]['Insert']

/** Update payload for a table, e.g. `Update<'products'>`. */
export type Update<T extends keyof Public['Tables']> = Public['Tables'][T]['Update']

export type DocumentStatus = Public['Enums']['document_status']
export type DocumentType = Public['Enums']['document_type']
export type LocationType = Public['Enums']['location_type']
export type MovementType = Public['Enums']['movement_type']

export type Product = Row<'products'>
export type Category = Row<'categories'>
export type Unit = Row<'units'>
export type Location = Row<'locations'>
export type PriceList = Row<'price_lists'>
export type Supplier = Row<'suppliers'>
export type Customer = Row<'customers'>
export type InventoryLot = Row<'inventory_lots'>
export type Purchase = Row<'purchases'>
export type PurchaseItem = Row<'purchase_items'>
export type Sale = Row<'sales'>
export type SaleItem = Row<'sale_items'>
export type Transfer = Row<'inventory_transfers'>
export type TransferItem = Row<'inventory_transfer_items'>

export type ProductStock = Row<'v_product_stock'>
export type StockByLocation = Row<'v_stock_by_location'>
export type StockByLot = Row<'v_stock_by_lot'>
export type ExpiringStock = Row<'v_expiring_stock'>
export type CurrentPrice = Row<'v_current_prices'>
export type LedgerEntry = Row<'v_inventory_ledger'>

/**
 * Labels for the database enums. Kept next to the types so a new enum value
 * added in a migration surfaces as a TypeScript error here rather than as a
 * blank cell in the UI.
 */
export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Borrador',
  confirmed: 'Confirmado',
  cancelled: 'Anulado',
}

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  warehouse: 'Bodega',
  store: 'Tienda',
  pos: 'Punto de venta',
  dispatch: 'Zona de despacho',
  production: 'Producción',
  other: 'Otro',
}

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  initial_stock: 'Stock inicial',
  purchase: 'Compra',
  sale: 'Venta',
  transfer: 'Transferencia',
  adjustment: 'Ajuste',
  return: 'Devolución',
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  purchase: 'Compra',
  sale: 'Venta',
  transfer: 'Transferencia',
  manual: 'Manual',
}
