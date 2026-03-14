import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" aria-label="Fil d'Ariane">
      <div className="breadcrumb-item">
        <Link href="/" className="breadcrumb-link">
          <Home size={16} />
        </Link>
      </div>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <span className="breadcrumb-separator" aria-hidden="true">
            <ChevronRight size={16} />
          </span>
          <div className="breadcrumb-item">
            {item.href && index < items.length - 1 ? (
              <Link href={item.href} className="breadcrumb-link">
                {item.label}
              </Link>
            ) : (
              <span className="breadcrumb-current">{item.label}</span>
            )}
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
}


