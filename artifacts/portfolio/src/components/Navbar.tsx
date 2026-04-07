import { useState, useEffect } from "react";
import { Link } from "wouter";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Blog", href: "#blog" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "hsl(22 12% 6% / 0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid hsl(25 10% 16% / 0.8)" : "1px solid transparent",
      }}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <span className="cursor-pointer inline-flex items-center" aria-label="Soumya Raikwar home">
            <img
              src="/sr-logo-256.png"
              alt="SR logo"
              className="h-10 w-10 rounded-full object-cover"
              style={{ border: "1px solid hsl(var(--border))" }}
            />
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <button
                onClick={() => handleNav(link.href)}
                className="text-sm font-body tracking-wide transition-colors duration-200 cursor-pointer"
                style={{ color: "hsl(var(--muted-foreground))" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--foreground))")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}
              >
                {link.label}
              </button>
            </li>
          ))}
          <li>
            <Link href="/blog">
              <span
                className="text-sm font-body tracking-wide transition-colors duration-200 cursor-pointer"
                style={{ color: "hsl(var(--muted-foreground))" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--foreground))")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--muted-foreground))")}
              >
                All Posts
              </span>
            </Link>
          </li>
        </ul>

        {/* Mobile menu button */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className="block w-5 h-px transition-all duration-300"
            style={{
              background: "hsl(var(--foreground))",
              transform: menuOpen ? "rotate(45deg) translate(3px, 3px)" : "none",
            }}
          />
          <span
            className="block w-5 h-px transition-all duration-300"
            style={{
              background: "hsl(var(--foreground))",
              opacity: menuOpen ? 0 : 1,
            }}
          />
          <span
            className="block w-5 h-px transition-all duration-300"
            style={{
              background: "hsl(var(--foreground))",
              transform: menuOpen ? "rotate(-45deg) translate(3px, -3px)" : "none",
            }}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t"
          style={{
            background: "hsl(22 12% 6% / 0.98)",
            borderColor: "hsl(var(--border))",
          }}
        >
          <ul className="px-6 py-4 flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <button
                  onClick={() => handleNav(link.href)}
                  className="text-base font-body w-full text-left"
                  style={{ color: "hsl(var(--foreground))" }}
                >
                  {link.label}
                </button>
              </li>
            ))}
            <li>
              <Link href="/blog" onClick={() => setMenuOpen(false)}>
                <span className="text-base font-body" style={{ color: "hsl(var(--primary))" }}>
                  All Blog Posts
                </span>
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
