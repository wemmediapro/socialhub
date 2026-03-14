import React, { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ content, children, position = 'bottom' }: TooltipProps) {
  return (
    <div className={`tooltip tooltip-${position}`}>
      {children}
      <div className="tooltip-content" role="tooltip">
        {content}
      </div>
    </div>
  );
}


