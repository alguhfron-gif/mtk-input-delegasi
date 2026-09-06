import React from 'react';

interface LogoMTKProps {
  className?: string;
  size?: number | string;
}

export const LogoMTK: React.FC<LogoMTKProps> = ({ className = 'w-16 h-16', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 520 540" 
      className={className} 
      style={style}
      aria-label="Logo MTK Pondok Pesantren Sidogiri"
    >
      <defs>
        <g id="mtk-star">
          <polygon points="0,-12 3.5,-3.5 11.5,-3.5 5,1.5 7.5,9.5 0,4.5 -7.5,9.5 -5,1.5 -11.5,-3.5 -3.5,-3.5" fill="#ffffff" />
        </g>
        <g id="mtk-star-small">
          <polygon points="0,-6 1.8,-1.8 5.8,-1.8 2.5,0.8 3.8,4.8 0,2.3 -3.8,4.8 -2.5,0.8 -5.8,-1.8 -1.8,-1.8" fill="#ffffff" />
        </g>
      </defs>

      {/* Group: Top Triangular Emblem */}
      <g transform="translate(10, 0)">
        {/* Outer Triangle Border */}
        <polygon points="250,15 90,265 410,265" fill="none" stroke="#0e5a5c" stroke-width="5" stroke-linejoin="round" />
        <polygon points="250,23 98,258 402,258" fill="#0e5a5c" stroke="#0e5a5c" stroke-width="2" stroke-linejoin="round" />

        {/* Top Star */}
        <use href="#mtk-star" x="250" y="54" />

        {/* Center Minaret / Menara Sidogiri */}
        <circle cx="250" cy="74" r="5" fill="#ffffff" />
        <path d="M245,86 C245,78 255,78 255,86 Z" fill="#ffffff" />
        <rect x="242" y="86" width="16" height="3" rx="1" fill="#ffffff" />
        <rect x="244" y="90" width="12" height="18" fill="#ffffff" />
        <rect x="248" y="94" width="4" height="7" rx="2" fill="#0e5a5c" />
        <polygon points="243,108 257,108 259,138 241,138" fill="#ffffff" />
        <path d="M241,138 L259,138 L262,156 L238,156 Z" fill="#ffffff" />
        
        {/* Light rays */}
        <line x1="230" y1="92" x2="220" y2="88" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
        <line x1="270" y1="92" x2="280" y2="88" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
        <line x1="228" y1="106" x2="216" y2="106" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
        <line x1="272" y1="106" x2="284" y2="106" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />

        {/* Left Arc Stars (5 stars) */}
        <use href="#mtk-star-small" x="216" y="78" />
        <use href="#mtk-star-small" x="198" y="95" />
        <use href="#mtk-star-small" x="186" y="116" />
        <use href="#mtk-star-small" x="179" y="140" />
        <use href="#mtk-star-small" x="177" y="166" />

        {/* Right Arc Stars (5 stars) */}
        <use href="#mtk-star-small" x="284" y="78" />
        <use href="#mtk-star-small" x="302" y="95" />
        <use href="#mtk-star-small" x="314" y="116" />
        <use href="#mtk-star-small" x="321" y="140" />
        <use href="#mtk-star-small" x="323" y="166" />

        {/* Globe (Bola Dunia) with latitude & longitude lines */}
        <g transform="translate(250, 168)">
          <circle cx="0" cy="0" r="28" fill="#0e5a5c" stroke="#ffffff" stroke-width="2.5" />
          <line x1="-28" y1="0" x2="28" y2="0" stroke="#ffffff" stroke-width="1.8" />
          <path d="M-24,-14 Q0,-2 24,-14" fill="none" stroke="#ffffff" stroke-width="1.5" />
          <path d="M-24,14 Q0,2 24,14" fill="none" stroke="#ffffff" stroke-width="1.5" />
          <ellipse cx="0" cy="0" rx="14" ry="28" fill="none" stroke="#ffffff" stroke-width="1.5" />
          <line x1="0" y1="-28" x2="0" y2="28" stroke="#ffffff" stroke-width="1.8" />
        </g>

        {/* Open Book (Kitab Kuning / Al-Qur'an) */}
        <g transform="translate(250, 194)">
          <path d="M-2,6 Q-22,0 -42,5 L-42,12 Q-22,7 -2,12 Z" fill="#ffffff" />
          <path d="M2,6 Q22,0 42,5 L42,12 Q22,7 2,12 Z" fill="#ffffff" />
          <polygon points="-8,11 8,11 16,22 -16,22" fill="#ffffff" />
        </g>

        {/* Ribbon / Pita Bertuliskan "SANTRI" */}
        <g transform="translate(250, 232)">
          <path d="M-60,-2 L60,-2 L68,14 L-68,14 Z" fill="#ffffff" stroke="#ffffff" stroke-width="1" />
          <polygon points="-68,14 -90,5 -82,24 -62,20" fill="#ffffff" />
          <polygon points="68,14 90,5 82,24 62,20" fill="#ffffff" />
          <text x="0" y="10" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="12" fill="#0e5a5c" letter-spacing="2">SANTRI</text>
        </g>
      </g>

      {/* Arabic Calligraphy: مشاورة وتعليم الكتاب */}
      <g fill="#0e5a5c" transform="translate(260, 345)">
        <text x="0" y="0" text-anchor="middle" font-family="'Scheherazade New', 'Amiri', 'Traditional Arabic', 'Noto Naskh Arabic', serif" font-weight="bold" font-size="60" letter-spacing="1">
          مشاورة وتعليم الكتاب
        </text>
      </g>

      {/* Latin Text: Musyawarah wa Taklimul Kitab */}
      <text x="260" y="425" text-anchor="middle" font-family="'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-weight="600" font-size="34" fill="#0e5a5c" letter-spacing="0.5">
        Musyawarah wa Taklimul Kitab
      </text>

      {/* Latin Text: PONDOK PESANTREN SIDOGIRI */}
      <text x="260" y="485" text-anchor="middle" font-family="'Cinzel', 'Times New Roman', 'Trajan Pro', Georgia, serif" font-weight="700" font-size="36" fill="#0e5a5c" letter-spacing="3.5">
        PONDOK PESANTREN SIDOGIRI
      </text>
    </svg>
  );
};
