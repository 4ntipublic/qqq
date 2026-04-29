'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType, SVGProps } from 'react'

// Routes where the footer should NOT appear. Admin keeps its own bottom-less
// dashboard chrome; auth screens are intentionally barebones.
const HIDDEN_PREFIXES = ['/admin', '/auth']

// lucide-react dropped the brand glyphs (trademark policy). We render the
// canonical marks inline so they stay crisp at any size and themable.
type IconProps = SVGProps<SVGSVGElement>

const InstagramIcon: ComponentType<IconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)

const YoutubeIcon: ComponentType<IconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
    <path d="M22 7.5a3 3 0 0 0-2.1-2.1C18.1 5 12 5 12 5s-6.1 0-7.9.4A3 3 0 0 0 2 7.5 31 31 0 0 0 1.6 12 31 31 0 0 0 2 16.5a3 3 0 0 0 2.1 2.1C5.9 19 12 19 12 19s6.1 0 7.9-.4a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22.4 12 31 31 0 0 0 22 7.5Z" />
    <path d="m10 9.5 5 2.5-5 2.5v-5Z" fill="currentColor" stroke="none" />
  </svg>
)

const SoundcloudIcon: ComponentType<IconProps> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
    <path d="M3 14v3" />
    <path d="M5.5 12.5v5" />
    <path d="M8 11v6.5" />
    <path d="M10.5 9.5v8" />
    <path d="M13 8v9.5" />
    <path d="M15.5 8.5a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H13" />
  </svg>
)

const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/akpkyy',
    icon: InstagramIcon,
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@akpkyy',
    icon: YoutubeIcon,
  },
  {
    label: 'SoundCloud',
    href: 'https://soundcloud.com/akpkyy',
    icon: SoundcloudIcon,
  },
]

const LEGAL_LINKS = [
  { label: 'Términos', href: '/legal/terms' },
  { label: 'Privacidad', href: '/legal/privacy' },
]

export default function GlobalFooter() {
  const pathname = usePathname() ?? ''
  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  if (hidden) return null

  const year = new Date().getFullYear()

  return (
    <footer
      role="contentinfo"
      className="relative mt-24 border-t border-black/[0.06] bg-white/30 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 py-8 sm:flex-row sm:justify-between sm:gap-4">
        <p className="text-[12px] font-light tracking-tight text-muted-foreground">
          © {year} akpkyy. Todos los derechos reservados.
        </p>

        <div className="flex items-center gap-1.5">
          {SOCIAL_LINKS.map((social) => {
            const Icon = social.icon
            return (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-black/[0.04] hover:text-foreground"
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
              </a>
            )
          })}
        </div>

        <nav aria-label="Enlaces legales" className="flex items-center gap-4">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[12px] font-light tracking-tight text-muted-foreground transition hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
