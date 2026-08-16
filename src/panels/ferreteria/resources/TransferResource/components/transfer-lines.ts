export type TransferLine = {
  /** Client-side identity, so React keys survive reordering and removal. */
  key: string
  product_id: string
  quantity: string
  lot_id: string
}

export function emptyTransferLine(): TransferLine {
  return {
    key: `line-${Math.random().toString(36).slice(2)}`,
    product_id: '',
    quantity: '1',
    lot_id: '',
  }
}
