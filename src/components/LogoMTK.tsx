import React from 'react';

interface LogoMTKProps {
  className?: string;
  size?: number | string;
}

export const LogoMTK: React.FC<LogoMTKProps> = ({ className = 'w-16 h-16', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src="/logo-mtk.png"
      alt="Logo MTK Pondok Pesantren Sidogiri"
      className={`${className} object-contain select-none`}
      style={style}
      loading="eager"
      onError={(e) => {
        // Fallback to vector SVG if PNG is not accessible
        (e.currentTarget as HTMLImageElement).src = '/logo-mtk.svg';
      }}
    />
  );
};
