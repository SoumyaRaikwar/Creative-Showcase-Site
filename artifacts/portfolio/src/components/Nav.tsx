import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import Monogram from "./Monogram";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { href: "/work", label: "Work" },
  { href: "/writing", label: "Writing" },
  { href: "/blog", label: "Blog" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export default function Nav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location]);

  const isActive = (href: string) => (href.startsWith("/#") ? false : location === href || location.startsWith(href + "/"));

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b transition-colors"
      style={{
        borderColor: scrolled || open ? "var(--line)" : "transparent",
        background: scrolled || open ? "color-mix(in srgb, var(--ground) 88%, transparent)" : "transparent",
        backdropFilter: scrolled || open ? "blur(10px)" : "none",
      }}
    >
      <nav className="wrap flex h-16 items-center justify-between" aria-label="Primary">
        <Link href="/" className="flex items-center gap-3">
          <Monogram />
          <span className="font-display text-[15px] font-semibold tracking-tight max-sm:sr-only">Soumya Raikwar</span>
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-[14px] text-muted hover:text-text"
                style={isActive(l.href) ? { color: "var(--text)" } : undefined}
                aria-current={isActive(l.href) ? "page" : undefined}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <ThemeToggle />
          </li>
        </ul>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[3px] border border-line text-muted"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <ul id="mobile-nav" className="wrap flex flex-col gap-1 border-t border-line py-3 md:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="block py-2.5 text-[16px] text-text">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
