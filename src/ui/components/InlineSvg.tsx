export type InlineSvgProps = {
  svg: string
  className?: string
}

/**
 * Renders raw SVG markup inline in the DOM (not via `<img src>`), so its
 * embedded CSS can react to ancestor state like the app's `.dark` class —
 * an `<img>`-loaded SVG is an isolated document and can't see it.
 */
export function InlineSvg({ svg, className }: InlineSvgProps) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: svg }} />
}
