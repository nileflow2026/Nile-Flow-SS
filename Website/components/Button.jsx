/**
 * Nile Flow Shared Button Component
 *
 * A production-ready, accessible, reusable button component that
 * matches the Nile Flow Mobile Application design system.
 *
 * Variants:
 *   primary   — Solid green CTA (#16A34A)
 *   secondary — Light gray background
 *   outline   — Transparent with border
 *   ghost     — Transparent, shows on hover
 *   danger    — Red for destructive actions
 *
 * Sizes:
 *   sm / md / lg
 *
 * States:
 *   loading / disabled / icon support / fullWidth
 */
import React, { forwardRef, memo } from "react";

const BASE_STYLES = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  textDecoration: "none",
  transition: "all 200ms ease",
  borderRadius: "var(--nf-radius-md)",
  fontFamily: "inherit",
  flexShrink: 0,
};

const VARIANT_STYLES = {
  primary: {
    background: "var(--nf-btn-primary-bg)",
    color: "var(--nf-btn-primary-text)",
  },
  secondary: {
    background: "var(--nf-btn-secondary-bg)",
    color: "var(--nf-btn-secondary-text)",
    border: "1px solid var(--nf-border)",
  },
  outline: {
    background: "transparent",
    color: "var(--nf-accent)",
    border: "2px solid var(--nf-accent)",
  },
  ghost: {
    background: "transparent",
    color: "var(--nf-text-secondary)",
    border: "none",
  },
  danger: {
    background: "var(--nf-btn-danger-bg)",
    color: "var(--nf-btn-danger-text)",
  },
};

const SIZE_STYLES = {
  sm: { padding: "6px 12px", fontSize: "0.8125rem", borderRadius: "var(--nf-radius-sm)" },
  md: { padding: "10px 20px", fontSize: "0.9375rem" },
  lg: { padding: "14px 28px", fontSize: "1rem", borderRadius: "var(--nf-radius-lg)" },
};

const SPINNER = (
  <svg
    className="nf-btn-spinner"
    viewBox="0 0 24 24"
    fill="none"
    style={{
      width: "16px",
      height: "16px",
      animation: "spin 0.6s linear infinite",
    }}
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeDasharray="31.4 31.4"
      strokeLinecap="round"
      opacity="0.3"
    />
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeDasharray="31.4 31.4"
      strokeLinecap="round"
      strokeDashoffset="-15.7"
    />
  </svg>
);

const Button = forwardRef(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      fullWidth = false,
      icon: Icon,
      iconPosition = "left",
      type = "button",
      className = "",
      style = {},
      onClick,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    const combinedStyle = {
      ...BASE_STYLES,
      ...VARIANT_STYLES[variant],
      ...SIZE_STYLES[size],
      ...(fullWidth ? { width: "100%" } : {}),
      ...(isDisabled
        ? {
            opacity: 0.5,
            cursor: "not-allowed",
            pointerEvents: "none",
          }
        : {}),
      ...(variant === "primary" && !isDisabled
        ? {
            ":hover": {
              background: "var(--nf-btn-primary-hover)",
              transform: "translateY(-1px)",
              boxShadow: "var(--nf-shadow-md)",
            },
            ":active": {
              transform: "translateY(0)",
            },
          }
        : {}),
      ...(variant === "secondary" && !isDisabled
        ? {
            ":hover": {
              background: "var(--nf-btn-secondary-hover)",
            },
          }
        : {}),
      ...(variant === "outline" && !isDisabled
        ? {
            ":hover": {
              background: "var(--nf-accent-surface)",
              borderColor: "var(--nf-accent-hover)",
            },
          }
        : {}),
      ...(variant === "ghost" && !isDisabled
        ? {
            ":hover": {
              background: "var(--nf-btn-ghost-hover)",
            },
          }
        : {}),
      ...(variant === "danger" && !isDisabled
        ? {
            ":hover": {
              background: "var(--nf-btn-danger-hover)",
            },
          }
        : {}),
      ...style,
    };

    // Inline hover effects via className since inline :hover isn't supported
    const variantHoverClass = {
      primary: "hover:brightness-110 hover:-translate-y-0.5 hover:shadow-md",
      secondary: "hover:bg-[var(--nf-btn-secondary-hover)]",
      outline: "hover:bg-[var(--nf-accent-surface)]",
      ghost: "hover:bg-[var(--nf-btn-ghost-hover)]",
      danger: "hover:brightness-110",
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`nf-button nf-button--${variant} nf-button--${size} ${variantHoverClass} ${
          fullWidth ? "w-full" : ""
        } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} active:scale-[0.98] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nf-accent)] ${className}`}
        style={combinedStyle}
        onClick={onClick}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...rest}
      >
        {loading && SPINNER}
        {!loading && Icon && iconPosition === "left" && (
          <Icon size={size === "sm" ? 14 : size === "lg" ? 20 : 16} aria-hidden="true" />
        )}
        {children && <span>{children}</span>}
        {!loading && Icon && iconPosition === "right" && (
          <Icon size={size === "sm" ? 14 : size === "lg" ? 20 : 16} aria-hidden="true" />
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default memo(Button);
