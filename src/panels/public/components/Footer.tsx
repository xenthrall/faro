import { Globe } from 'lucide-react'
import githubSvg from 'simple-icons/icons/github.svg?raw'

// simple-icons ships each icon's raw path with no fill set, so it renders
// black regardless of theme — force currentColor so it follows the same
// text-color classes as everything else here.
const githubIcon = githubSvg.replace('<svg ', '<svg fill="currentColor" ')

const links = [
  {
    href: 'https://github.com/xenthrall',
    label: 'GitHub',
    icon: <span className="h-[18px] w-[18px]" dangerouslySetInnerHTML={{ __html: githubIcon }} />,
  },
  {
    href: 'https://hello.tequia.dev/',
    label: 'Sitio personal',
    icon: <Globe className="h-[18px] w-[18px]" />,
  },
]

/** Subtle footer for the public panel's pages — present on every one, but never loud. */
export function Footer() {
  return (
    <footer className="mt-12 flex flex-col items-center gap-3 border-t border-gray-200 py-6 text-xs text-gray-400 sm:flex-row sm:justify-between dark:border-gray-800 dark:text-gray-500">
      <p>Hecho con Faro.</p>

      <div className="flex items-center gap-4">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            aria-label={link.label}
            className="text-gray-400 transition-colors hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
          >
            {link.icon}
          </a>
        ))}
      </div>
    </footer>
  )
}
