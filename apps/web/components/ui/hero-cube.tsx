'use client';

import React, { useRef, useEffect } from 'react';

interface HeroCubeProps {
  className?: string;
  size?: number;
}

export function HeroCube({ className = '', size = 225 }: HeroCubeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video plays reliably even on mobile power-save or strict browsers
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may wait for user interaction; fallback poster remains visible
      });
    }
  }, []);

  return (
    <div
      className={`relative flex items-center justify-center select-none pointer-events-auto ${className}`}
      aria-hidden="true"
    >
      {/* Ambient background glow behind the cube */}
      <div className="absolute w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] rounded-full bg-gradient-to-tr from-sky-500/15 via-orange-500/10 to-cyan-500/15 dark:from-sky-500/25 dark:via-blue-600/15 dark:to-orange-500/20 blur-3xl pointer-events-none -z-10 animate-pulse" />

      {/* Floating 3D Cube Container */}
      <div className="relative group cursor-pointer transition-transform duration-500 ease-out hover:scale-105 active:scale-95 animate-float-slow">
        {/* Soft feather vignette mask so video edges blend seamlessly into background */}
        <div
          className="relative w-[190px] h-[190px] sm:w-[225px] sm:h-[225px] md:w-[245px] md:h-[245px] overflow-hidden flex items-center justify-center rounded-3xl"
          style={{
            maskImage:
              'radial-gradient(circle at center, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 88%)',
            WebkitMaskImage:
              'radial-gradient(circle at center, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 88%)',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            width={size}
            height={size}
            poster="/static/cube-fallback.jpg"
            src="/static/cube.mp4"
            className="w-full h-full object-cover pointer-events-none filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)] dark:drop-shadow-[0_20px_40px_rgba(0,153,230,0.25)]"
          />
        </div>

        {/* Subtle interactive hover ring / sheen */}
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent blur-sm" />
      </div>
    </div>
  );
}
