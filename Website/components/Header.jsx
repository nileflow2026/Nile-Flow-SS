/* eslint-disable no-unused-vars */
import React, { memo } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../Context/CartContext";
import {
  Bell,
  ChevronDown,
  Search,
  ShoppingCart,
  Menu,
  X,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useNotification } from "../Context/NotificationContext";
import NotificationSettings from "./NotificationSettings";
import i18n from "../i18n";
import { logoutCustomer } from "../authServices";
import { useState, useEffect } from "react";
import { useCustomerAuth } from "../Context/CustomerAuthContext";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrollEffect, setScrollEffect] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] =
    useState(false);

  const { user, isLoading: userLoading } = useCustomerAuth();
  const { cart } = useCart();
  const { notificationCount, isNotificationsEnabled } = useNotification();

  useEffect(() => {
    let rafPending = false;
    const handleScroll = () => {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          setScrollEffect(window.scrollY > 20);
          rafPending = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: scrollEffect
          ? "var(--nf-header-bg)"
          : "rgba(255, 255, 255, 0.85)",
        borderBottom: "1px solid var(--nf-header-border)",
        backdropFilter: scrollEffect ? "blur(12px)" : "blur(8px)",
        WebkitBackdropFilter: scrollEffect ? "blur(12px)" : "blur(8px)",
        transition: "all 0.3s ease",
        boxShadow: scrollEffect
          ? "0 1px 3px rgba(0, 0, 0, 0.08)"
          : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Announcement Bar */}
        <div className="hidden md:flex justify-center py-1.5 border-b border-[var(--nf-border-subtle)]">
          <div className="flex items-center space-x-2 text-xs font-medium" style={{ color: "var(--nf-text-muted)" }}>
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "var(--nf-accent)" }}
            ></span>
            <span>
              Premium African Marketplace • Express Delivery • 100% Authentic
            </span>
          </div>
        </div>

        {/* Main Header */}
        <div className="flex items-center justify-between py-2.5">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <img
              src="/images/logo.png"
              alt="Nile Flow"
              className="h-10 w-10 md:h-12 md:w-12 object-contain"
              loading="eager"
              decoding="async"
            />
            <span
              className="hidden lg:inline text-lg md:text-xl font-bold tracking-wide"
              style={{ color: "var(--nf-accent-dark)" }}
            >
              NILE FLOW
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {[
              { to: "/", label: "Home" },
              { to: "/shop", label: "Shop" },
              { to: "/deals", label: "Deals" },
              { to: "/contact", label: "Contact Us" },
              { to: "/language", label: "Language" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-3 py-2 text-sm font-medium rounded-md transition-all duration-200"
                style={{
                  color: "var(--nf-nav-link)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--nf-btn-ghost-hover)";
                  e.currentTarget.style.color = "var(--nf-nav-link-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--nf-nav-link)";
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Action Icons & Profile */}
          <div className="flex items-center space-x-2">
            {/* Search */}
            <Link
              to="/search"
              className="p-2 rounded-md transition-all duration-200"
              style={{ color: "var(--nf-text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--nf-btn-ghost-hover)";
                e.currentTarget.style.color = "var(--nf-accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--nf-text-muted)";
              }}
              aria-label="Search products"
            >
              <Search size={18} />
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-md transition-all duration-200"
              style={{ color: "var(--nf-text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--nf-btn-ghost-hover)";
                e.currentTarget.style.color = "var(--nf-accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--nf-text-muted)";
              }}
              aria-label={`Shopping cart with ${cart.length} items`}
            >
              <ShoppingCart size={18} />
              {cart.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                  style={{ background: "var(--nf-accent)" }}
                >
                  {cart.length}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <Link
              to="/notification"
              className="relative p-2 rounded-md transition-all duration-200"
              style={{ color: "var(--nf-text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--nf-btn-ghost-hover)";
                e.currentTarget.style.color = "var(--nf-accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--nf-text-muted)";
              }}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {notificationCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                  style={{ background: "var(--nf-error)" }}
                >
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Profile/Login Desktop */}
            {!userLoading && (
              <div className="hidden lg:block">
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center space-x-2 p-1.5 rounded-md transition-all duration-200"
                      style={{ color: "var(--nf-text-secondary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--nf-btn-ghost-hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (!dropdownOpen) e.currentTarget.style.background = "transparent";
                      }}
                      aria-label="User menu"
                      aria-expanded={dropdownOpen}
                    >
                      <img
                        src={user.avatarUrl || "/images/logo.png"}
                        alt={user.username || "Profile"}
                        className="w-8 h-8 rounded-full object-cover"
                        style={{ border: "2px solid var(--nf-border)" }}
                        loading="lazy"
                        decoding="async"
                      />
                      <ChevronDown
                        size={14}
                        style={{
                          transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    </button>

                    {dropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setDropdownOpen(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 z-50">
                          <div
                            className="rounded-xl overflow-hidden shadow-lg"
                            style={{
                              background: "var(--nf-bg-elevated)",
                              border: "1px solid var(--nf-border)",
                            }}
                          >
                            <div
                              className="p-4"
                              style={{
                                borderBottom: "1px solid var(--nf-border-subtle)",
                              }}
                            >
                              <p
                                className="font-semibold truncate"
                                style={{ color: "var(--nf-text-primary)" }}
                              >
                                {user.username}
                              </p>
                              <p
                                className="text-xs mt-0.5"
                                style={{ color: "var(--nf-text-muted)" }}
                              >
                                {user.email || "Member"}
                              </p>
                            </div>
                            <div className="p-2">
                              <Link
                                to="/profile"
                                className="flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200"
                                style={{ color: "var(--nf-text-primary)" }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "var(--nf-btn-ghost-hover)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "transparent";
                                }}
                                onClick={() => setDropdownOpen(false)}
                              >
                                <User size={16} style={{ color: "var(--nf-accent)" }} />
                                <span className="text-sm">Profile</span>
                              </Link>
                              <Link
                                to="/settings"
                                className="flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200"
                                style={{ color: "var(--nf-text-primary)" }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "var(--nf-btn-ghost-hover)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "transparent";
                                }}
                                onClick={() => setDropdownOpen(false)}
                              >
                                <Settings size={16} style={{ color: "var(--nf-accent)" }} />
                                <span className="text-sm">Settings</span>
                              </Link>
                              <button
                                className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg transition-all duration-200"
                                style={{ color: "var(--nf-text-primary)" }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "var(--nf-error-surface)";
                                  e.currentTarget.style.color = "var(--nf-error)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "transparent";
                                  e.currentTarget.style.color = "var(--nf-text-primary)";
                                }}
                                onClick={async () => {
                                  await logoutCustomer();
                                  setDropdownOpen(false);
                                }}
                              >
                                <LogOut size={16} />
                                <span className="text-sm">Logout</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/signin"
                    className="px-5 py-2 rounded-md text-sm font-semibold transition-all duration-200"
                    style={{
                      background: "var(--nf-btn-primary-bg)",
                      color: "var(--nf-btn-primary-text)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--nf-btn-primary-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--nf-btn-primary-bg)";
                    }}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-md transition-all duration-200"
              style={{ color: "var(--nf-text-muted)" }}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close mobile menu" : "Open mobile menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div className="lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            style={{ background: "var(--nf-bg-overlay)" }}
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div
            className="fixed top-0 right-0 h-full w-80 z-50 shadow-lg animate-slideInRight overflow-y-auto"
            style={{
              background: "var(--nf-bg-elevated)",
              borderLeft: "1px solid var(--nf-border)",
            }}
          >
            {/* Menu Header */}
            <div
              className="p-6"
              style={{ borderBottom: "1px solid var(--nf-border-subtle)" }}
            >
              {user ? (
                <div className="flex items-center space-x-3">
                  <img
                    src={user.avatarUrl || "/images/logo.png"}
                    alt={user.username || "Profile"}
                    className="w-12 h-12 rounded-full object-cover"
                    style={{ border: "2px solid var(--nf-border)" }}
                    loading="lazy"
                    decoding="async"
                  />
                  <div>
                    <p
                      className="font-semibold"
                      style={{ color: "var(--nf-text-primary)" }}
                    >
                      {user.username}
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--nf-text-muted)" }}
                    >
                      Welcome back!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p
                    className="font-semibold"
                    style={{ color: "var(--nf-text-primary)" }}
                  >
                    Welcome to Nile Flow
                  </p>
                </div>
              )}
            </div>

            {/* Menu Links */}
            <div className="p-4 space-y-1">
              {[
                { to: "/", label: "Home" },
                { to: "/shop", label: "Shop" },
                { to: "/deals", label: "Deals" },
                { to: "/contact", label: "Contact Us" },
                { to: "/about-us", label: "About Us" },
                { to: "/language", label: "Language" },
                { to: "/profile", label: "Profile" },
                { to: "/settings", label: "Settings" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{ color: "var(--nf-text-primary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--nf-btn-ghost-hover)";
                    e.currentTarget.style.color = "var(--nf-accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--nf-text-primary)";
                  }}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              {/* Auth Buttons */}
              <div
                className="pt-4 mt-4"
                style={{ borderTop: "1px solid var(--nf-border-subtle)" }}
              >
                {user ? (
                  <button
                    onClick={async () => {
                      await logoutCustomer();
                      setMenuOpen(false);
                    }}
                    className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={{
                      background: "var(--nf-error)",
                      color: "#ffffff",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--nf-btn-danger-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--nf-error)";
                    }}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                ) : (
                  <Link
                    to="/signin"
                    className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={{
                      background: "var(--nf-btn-primary-bg)",
                      color: "var(--nf-btn-primary-text)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--nf-btn-primary-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--nf-btn-primary-bg)";
                    }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <User size={16} />
                    <span>Sign In / Register</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 text-center">
              <p className="text-xs" style={{ color: "var(--nf-text-muted)" }}>
                &copy; 2026 Nile Flow Africa. Premium African E-commerce
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings Modal */}
      <NotificationSettings
        isOpen={notificationSettingsOpen}
        onClose={() => setNotificationSettingsOpen(false)}
      />
    </header>
  );
};

export default memo(Header);
