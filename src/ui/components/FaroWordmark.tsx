import faroWordSvg from '@/assets/faro-word.svg?raw'
import { InlineSvg } from './InlineSvg'

export type FaroWordmarkProps = {
  className?: string
}

/** The "FARO" wordmark, inlined so it can react to the app's theme toggle. */
export function FaroWordmark({ className }: FaroWordmarkProps) {
  return <InlineSvg svg={faroWordSvg} className={className} />
}
