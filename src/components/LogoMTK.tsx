import React from 'react';
import { LOGO_MTK_BASE64 } from '../assets/logoData';

interface LogoMTKProps {
  className?: string;
  size?: number | string;
}

export const LogoMTK: React.FC<LogoMTKProps> = ({ className = 'w-16 h-16', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src={LOGO_MTK_BASE64 || '/logo-mtk.png'}
      alt="Logo MTK Pondok Pesantren Sidogiri"
      className={`${className} object-contain select-none`}
      style={style}
      loading="eager"
      crossOrigin="anonymous"
      onError={(e) => {
        // Fallback to vector SVG if base64/PNG is not accessible
        (e.currentTarget as HTMLImageElement).src = '/logo-mtk.svg';
      }}
    />
  );
};
