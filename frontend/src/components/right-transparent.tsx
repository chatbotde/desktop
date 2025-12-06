import React from 'react';

interface RightTransparentProps {
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  alwaysOnTop?: boolean;
}

const RightTransparent: React.FC<RightTransparentProps> = ({ 
  onClick, 
  children, 
  className = '',
  alwaysOnTop = true 
}) => {
  const getZIndex = () => {
    return alwaysOnTop ? 'z-[9999]' : 'z-[100]';
  };

  return (
    <div
      onClick={onClick}
      data-no-clickthrough
      className={`
        w-[10px] h-[120px]
        bg-transparent
        rounded-l-full
        shadow-[-2px_0_8px_rgba(0,0,0,0.1)]
        border border-white/60 border-r-0
        fixed right-0 top-[25%]
        ${getZIndex()}
        transition-all duration-300 ease-in-out
        hover:w-[30px] hover:bg-blue-500
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default RightTransparent;
