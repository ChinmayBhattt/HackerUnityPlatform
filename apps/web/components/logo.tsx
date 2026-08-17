import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ className = '', size = 36, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        <Image
          src="/logo-black.png"
          alt="Hacker's Unity Logo"
          width={size}
          height={size}
          className="object-contain transition-transform duration-200 group-hover:scale-105"
          priority
        />
      </div>

      {showText && (
        <div className="flex items-center font-black italic tracking-tighter select-none text-2xl sm:text-[26px] leading-none">
          <span className="text-[#0099e6] font-extrabold pr-1">
            Hacker&apos;s
          </span>
          <span className="text-[#ff7800] font-extrabold">
            Unity
          </span>
        </div>
      )}
    </div>
  );
}
