import React from 'react';
import { Mic } from 'lucide-react';


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
      title={showInputHint ? "" : undefined}
      className={`
        group
        w-[10px] h-[120px]
        bg-transparent
        rounded-l-full
        shadow-[-2px_0_8px_rgba(0,0,0,0.1)]
        border border-white/60 border-r-0
        fixed right-0 top-[25%]
        z-[100]
        transition-all duration-300 ease-in-out
        hover:w-[30px] hover:bg-blue-500
        flex flex-col items-center justify-center gap-4
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${className}
      `}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          window.dispatchEvent(new Event('toggle-assistant-visibility'));
        }}
        className="
          w-6 h-6 rounded-full 
          bg-white/20 hover:bg-white/40 
          flex items-center justify-center 
          transition-colors duration-200
          opacity-0 hover:opacity-100 group-hover:opacity-100
        "
      >
        <Mic className="w-3 h-3 text-white" />
      </div>
      {children}
    </div>
  );
};

export default RightTransparent;
