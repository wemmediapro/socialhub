import React from 'react';

interface PageHeaderProps {
  badge?: string;
  badgeIcon?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PageHeader({
  badge,
  badgeIcon,
  title,
  subtitle,
  actions,
  filters,
  children
}: PageHeaderProps) {
  return (
    <div className="page-header" style={{ 
      background: "var(--color-white)",
      borderRadius: "var(--border-radius-lg)",
      padding: "var(--spacing-6) var(--spacing-8)",
      marginBottom: "var(--spacing-8)",
      boxShadow: "var(--shadow-card)",
      border: "1px solid var(--color-border)"
    }}>
      {/* Top Section: Badge + Actions */}
      {(badge || actions) && (
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "var(--spacing-6)"
        }}>
          {badge && (
            <span className="badge-meta badge-meta-primary" style={{
              fontSize: "var(--font-size-xs)",
              fontWeight: "var(--font-weight-semibold)",
              textTransform: "uppercase",
              letterSpacing: "var(--letter-spacing-wide)",
              padding: "var(--spacing-1) var(--spacing-3)"
            }}>
              {badgeIcon && `${badgeIcon} `}
              {badge}
            </span>
          )}
          
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Title Section */}
      <div style={{ marginBottom: subtitle || filters ? "var(--spacing-6)" : "0" }}>
        <h1 className="page-title" style={{
          fontSize: "var(--font-size-5xl)",
          fontWeight: "var(--font-weight-bold)",
          marginBottom: subtitle ? "var(--spacing-3)" : "0",
          color: "var(--color-text-primary)",
          lineHeight: "var(--line-height-tight)"
        }}>
          {title}
        </h1>
        {subtitle && (
          <p className="page-subtitle" style={{ 
            maxWidth: "700px",
            fontSize: "var(--font-size-base)",
            color: "var(--color-text-secondary)",
            lineHeight: "var(--line-height-relaxed)"
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Filters Section */}
      {filters && (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "var(--spacing-6)",
          paddingTop: "var(--spacing-4)",
          borderTop: "1px solid var(--color-border)"
        }}>
          {filters}
        </div>
      )}

      {/* Children (additional content) */}
      {children}
    </div>
  );
}


