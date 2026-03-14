import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'spinner-sm',
    md: '',
    lg: 'spinner-lg'
  };

  return (
    <div className={`spinner ${sizeClasses[size]} ${className}`} role="status" aria-label="Chargement">
      <span className="sr-only">Chargement en cours...</span>
    </div>
  );
}


