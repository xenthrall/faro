import faroVectorSvg from '@/assets/faro-vector.svg?raw'

export type FaroLogoProps = {
  className?: string
}

/**
 * Inlines `faro-vector.svg` (rather than `<img src>`) so its embedded
 * `.dark`-scoped CSS custom properties actually respond to the app's theme
 * toggle — an `<img>`-loaded SVG is an isolated document and can't see the
 * host page's `.dark` class. Renders at most once per page: the SVG's
 * internal ids aren't namespaced, so a second instance would duplicate them.
 */
export function FaroLogo({ className }: FaroLogoProps) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: faroVectorSvg }} />
}
