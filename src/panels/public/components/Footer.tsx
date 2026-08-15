import { Globe } from "lucide-react";
import githubSvg from "simple-icons/icons/github.svg?raw";

// simple-icons ships each icon's raw path with no fill set, so it renders
// black regardless of theme — force currentColor so it follows the same
// text-color classes as everything else here.
const githubIcon = githubSvg.replace("<svg ", '<svg fill="currentColor" ');

const links = [
  {
    href: "https://github.com/xenthrall",
    label: "GitHub",
    text: "Ver en GitHub",
    icon: (
      <span
        className="h-[17px] w-[17px]"
        dangerouslySetInnerHTML={{ __html: githubIcon }}
      />
    ),
  },
  {
    href: "https://hello.tequia.dev/",
    label: "Sitio personal",
    text: "Mi sitio",
    icon: <Globe className="h-[17px] w-[17px]" />,
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-gray-100 pt-8 pb-10 text-xs text-gray-400 dark:border-gray-800/80 dark:text-gray-500">
      <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
        <p>
          El faro sigue encendido.{" "}
          <a
            href="https://github.com/xenthrall"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            Jhon Tequia
          </a>
          .
        </p>

        <div className="flex items-center gap-5">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.label}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-gray-900 dark:hover:text-gray-200"
            >
              {link.icon}
              <span>{link.text}</span>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
