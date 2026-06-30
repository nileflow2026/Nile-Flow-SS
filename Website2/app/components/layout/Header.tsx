import { Link } from "react-router";
import { Search, ShoppingCart, Menu, Bell } from "lucide-react";

/**
 * Nile Flow Header
 * Performance notes:
 *  - No inline mouseEnter/mouseLeave handlers (old Website had 25+)
 *  - Uses CSS classes for hover states
 *  - No backdrop-filter on scroll — solid background
 *  - Passive scroll listener not needed (no scroll-driven effects)
 */

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/deals", label: "Deals" },
  { to: "/contact", label: "Contact" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 border-b border-nile-border">
      <div className="container-page">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0"
            aria-label="Nile Flow Home"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-nile-green-600 flex items-center justify-center">
              <span className="text-white font-black text-sm md:text-base">NF</span>
            </div>
            <span className="hidden sm:inline text-lg font-bold text-nile-green-900 tracking-wide">
              NILE FLOW
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 text-sm font-medium text-nile-body rounded-lg hover:bg-nile-green-50 hover:text-nile-green-700 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <Link
              to="/search"
              className="p-2.5 text-nile-muted hover:text-nile-green-600 rounded-lg hover:bg-nile-green-50 transition-colors duration-200"
              aria-label="Search"
            >
              <Search size={20} />
            </Link>

            <Link
              to="/cart"
              className="relative p-2.5 text-nile-muted hover:text-nile-green-600 rounded-lg hover:bg-nile-green-50 transition-colors duration-200"
              aria-label="Cart"
            >
              <ShoppingCart size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-nile-green-600 text-white text-[10px] font-bold flex items-center justify-center">
                0
              </span>
            </Link>

            <Link
              to="/sign-in"
              className="hidden sm:inline-flex nile-btn text-sm py-2 px-4"
            >
              Sign In
            </Link>

            {/* Mobile menu toggle — placeholder for mobile drawer */}
            <button
              className="md:hidden p-2.5 text-nile-muted rounded-lg"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
