import { memo } from "react";
import PropTypes from "prop-types";

// =================== GLASS CARD COMPONENT ===================
function GlassCard({
  children,
  style = {},
  variant = "default",
  hover = false,
  glow = false,
  color = null,
  className = "",
  onClick,
  role,
  tabIndex,
  "aria-label": ariaLabel,
}) {
  const variants = {
    default: {
      background: "var(--glass1, rgba(255, 255, 255, 0.015))",
      border: "1px solid var(--border2, rgba(255, 255, 255, 0.05))",
      backdropFilter: "blur(20px)",
    },
    purple: {
      background: "var(--card-bg-purple, rgba(99, 102, 241, 0.04))",
      border: "1px solid var(--card-border-purple, rgba(99, 102, 241, 0.15))",
      backdropFilter: "blur(20px)",
    },
    cyan: {
      background: "var(--card-bg-cyan, rgba(6, 182, 212, 0.03))",
      border: "1px solid var(--card-border-cyan, rgba(6, 182, 212, 0.12))",
      backdropFilter: "blur(20px)",
    },
    rose: {
      background: "var(--card-bg-rose, rgba(244, 63, 94, 0.03))",
      border: "1px solid var(--card-border-rose, rgba(244, 63, 94, 0.12))",
      backdropFilter: "blur(20px)",
    },
    emerald: {
      background: "var(--card-bg-emerald, rgba(16, 185, 129, 0.03))",
      border: "1px solid var(--card-border-emerald, rgba(16, 185, 129, 0.12))",
      backdropFilter: "blur(20px)",
    },
    dark: {
      background: "rgba(8, 7, 16, 0.85)",
      border: "1px solid var(--border2, rgba(255, 255, 255, 0.05))",
      backdropFilter: "blur(24px)",
    },
    gradient: {
      background: "linear-gradient(135deg, var(--card-bg-purple, rgba(99, 102, 241, 0.08)), var(--card-bg-cyan, rgba(6, 182, 212, 0.02)))",
      border: "1px solid var(--card-border-purple, rgba(99, 102, 241, 0.18))",
      backdropFilter: "blur(20px)",
    },
  };

  const base = variants[variant] || variants.default;
  const glowStyle = glow
    ? {
        boxShadow: color
          ? `0 0 40px ${color}33,0 8px 30px rgba(0,0,0,0.3)`
          : "0 0 40px rgba(108,61,232,0.2),0 8px 30px rgba(0,0,0,0.3)",
      }
    : {};

  const handleMouseEnter = hover
    ? (e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.35),${
          color ? `0 0 30px ${color}33` : "0 0 30px rgba(108,61,232,0.2)"
        }`;
      }
    : undefined;

  const handleMouseLeave = hover
    ? (e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = glow
          ? color
            ? `0 0 40px ${color}33,0 8px 30px rgba(0,0,0,0.3)`
            : "0 0 40px rgba(108,61,232,0.2),0 8px 30px rgba(0,0,0,0.3)"
          : "var(--shadow-card)";
      }
    : undefined;

  return (
    <div
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      onClick={onClick}
      className={className}
      style={{
        ...base,
        borderRadius: 20,
        padding: "24px",
        transition: hover ? "all 0.3s cubic-bezier(0.34,1.2,0.64,1)" : "none",
        cursor: onClick ? "pointer" : undefined,
        boxShadow: "var(--shadow-card)",
        ...glowStyle,
        ...style,
      }}

      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

GlassCard.propTypes = {
  children: PropTypes.node,
  style: PropTypes.object,
  variant: PropTypes.oneOf(["default", "purple", "cyan", "rose", "emerald", "dark", "gradient"]),
  hover: PropTypes.bool,
  glow: PropTypes.bool,
  color: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
  role: PropTypes.string,
  tabIndex: PropTypes.number,
  "aria-label": PropTypes.string,
};

const MemoizedGlassCard = memo(GlassCard);
MemoizedGlassCard.displayName = "GlassCard";

export default MemoizedGlassCard;
