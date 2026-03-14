import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  size = 'md',
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const sizeClass = size !== 'md' ? `progress-${size}` : '';

  return (
    <div className={`progress ${sizeClass} ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div
        className="progress-bar"
        style={{ width: `${percentage}%` }}
      />
      {showLabel && (
        <span className="sr-only">{Math.round(percentage)}% complété</span>
      )}
    </div>
  );
}


