import { toNumber } from '@/lib/use-form'

/**
 * One editable line of a purchase or a sale. Prices are held as strings for
 * the same reason form values are: an empty field must stay distinguishable
 * from a deliberate zero.
 */
export type DocumentLine = {
  /** Client-side identity, so React keys survive reordering and removal. */
  key: string
  product_id: string
  quantity: string
  price: string
  tax_rate: string
}

export function emptyLine(): DocumentLine {
  return {
    key: `line-${Math.random().toString(36).slice(2)}`,
    product_id: '',
    quantity: '1',
    price: '',
    tax_rate: '',
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Mirrors the generated columns on `purchase_items` / `sale_items`
 * (`round(quantity * price, 2)` and so on) so the user sees the same totals
 * before saving that the database will compute after. The database remains
 * authoritative — this is a preview, never what gets stored.
 */
export function lineTotals(line: DocumentLine) {
  const subtotal = round2(toNumber(line.quantity) * toNumber(line.price))
  const tax = round2((subtotal * toNumber(line.tax_rate)) / 100)
  return { subtotal, tax, total: subtotal + tax }
}

export function documentTotals(lines: DocumentLine[]) {
  return lines.reduce(
    (acc, line) => {
      const totals = lineTotals(line)
      return {
        subtotal: acc.subtotal + totals.subtotal,
        tax: acc.tax + totals.tax,
        total: acc.total + totals.total,
      }
    },
    { subtotal: 0, tax: 0, total: 0 },
  )
}
