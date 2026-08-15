import faroVectorSvg from '@/assets/faro-vector.svg?raw'
import { InlineSvg } from './InlineSvg'

export type FaroLogoProps = {
  className?: string
}

/**
 * The animated lighthouse illustration (no wordmark — see `FaroWordmark`
 * for that). Renders at most once per page: the SVG's internal ids aren't
 * namespaced, so a second instance would duplicate them.
 */
export function FaroLogo({ className }: FaroLogoProps) {
  return <InlineSvg svg={faroVectorSvg} className={className} />
}
