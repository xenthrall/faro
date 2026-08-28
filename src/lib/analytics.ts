/** Shape of `analytics_summary(p_from, p_to)` — shared by the dashboard's "Hoy" card and the full Ventas y ganancia page. */
export type Summary = {
  revenue: number
  cost: number
  profit: number
  margin_pct: number | null
  units_sold: number
  sales_count: number
  average_ticket: number | null
  purchases_amount: number
  purchases_count: number
}

export const EMPTY_SUMMARY: Summary = {
  revenue: 0,
  cost: 0,
  profit: 0,
  margin_pct: null,
  units_sold: 0,
  sales_count: 0,
  average_ticket: null,
  purchases_amount: 0,
  purchases_count: 0,
}
