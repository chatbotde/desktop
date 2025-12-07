import React from 'react';
import { MessageSquare } from 'lucide-react';

interface RightTransparentProps {
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  showInputHint?: boolean;
}

const RightTransparent: React.FC<RightTransparentProps> = ({ 
  onClick, 
  children, 
  className = '',
  showInputHint = false
}) => {
  return (
    <div
      onClick={onClick}
      data-no-clickthrough
      title={showInputHint ? "Show chat input" : undefined}
      className={`
        w-[10px] h-[120px]
        bg-transparent
        rounded-l-full
        shadow-[-2px_0_8px_rgba(0,0,0,0.1)]
        border border-white/60 border-r-0
        fixed right-0 top-[25%]
        z-[100]
        transition-all duration-300 ease-in-out
        hover:w-[30px] hover:bg-blue-500
        flex items-center justify-center
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default RightTransparent;
