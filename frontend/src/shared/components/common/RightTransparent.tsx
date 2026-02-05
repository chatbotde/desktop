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
          absolute -top-10 right-0
          w-8 h-8 rounded-full
          bg-blue-600 hover:bg-blue-500
          flex items-center justify-center 
          shadow-lg border border-white/20
          cursor-pointer
          transition-all duration-200
          z-[101]
          opacity-0 group-hover:opacity-100
          scale-75 group-hover:scale-100
        "
      >
        <Mic className="w-4 h-4 text-white" />
      </div>

      {children}
    </div>
  );
};

export default RightTransparent;
