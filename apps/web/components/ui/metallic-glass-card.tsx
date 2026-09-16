'use client';

import React, { useRef, useState, useCallback } from 'react';

interface MetallicGlassCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function MetallicGlassCard({
  children,
  className = '',
  glowColor = 'rgba(148, 163, 184, 0.25)',
}: MetallicGlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Smooth 3D tilt calculation (-10 to 10 degrees)
    const rotateX = -((y - centerY) / centerY) * 11;
    const rotateY = ((x - centerX) / centerX) * 11;

    // Spotlight coordinates (percentage)
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setRotate({ x: rotateX, y: rotateY });
    setGlarePos({ x: glareX, y: glareY });
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
    setGlarePos({ x: 50, y: 50 });
  };

  return (
    <div
      className="group/card relative h-full select-none"
      style={{ perspective: '1200px' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Outer 3D Card Container with Metallic Glass Border ─────── */}
      <div
        ref={cardRef}
        style={{
          transform: isHovered
            ? `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateY(-8px) scale3d(1.025, 1.025, 1.025)`
            : 'rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)',
          transition: isHovered
            ? 'transform 0.12s cubic-bezier(0.2, 0, 0, 1)'
            : 'transform 0.55s cubic-bezier(0.25, 1, 0.5, 1)',
          transformStyle: 'preserve-3d',
        }}
        className={`
          relative h-full rounded-2xl p-[1.5px] overflow-hidden
          transition-shadow duration-500
          /* Metal Glass Border: Silver / Platinum / Gunmetal Gradient */
          bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400
          dark:from-slate-400/40 dark:via-slate-600/30 dark:to-slate-700/50
          group-hover/card:from-slate-100 group-hover/card:via-slate-300 group-hover/card:to-slate-400
          dark:group-hover/card:from-slate-300/80 dark:group-hover/card:via-slate-500/40 dark:group-hover/card:to-slate-600/70
          /* Metallic Glass Shadow Elevation */
          shadow-[0_4px_16px_rgba(15,23,42,0.05),0_1px_2px_rgba(15,23,42,0.06)]
          group-hover/card:shadow-[0_22px_45px_-12px_rgba(71,85,105,0.3),0_0_30px_-5px_rgba(148,163,184,0.4)]
          dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]
          dark:group-hover/card:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.85),0_0_35px_-2px_rgba(148,163,184,0.25)]
          cursor-default
          ${className}
        `}
      >
        {/* Dynamic Metallic Border Specular Glow following cursor */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(400px circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.85) 0%, rgba(203, 213, 225, 0.4) 30%, transparent 65%)`,
          }}
        />

        {/* ── Inner Frosted Glass Body ──────────────────────────────── */}
        <div
          className="relative h-full w-full rounded-[14.5px] p-6
            bg-white/92 dark:bg-[#0c1017]/90
            backdrop-blur-2xl
            border border-white/80 dark:border-white/[0.08]
            overflow-hidden
            flex flex-col justify-between"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Subtle metallic frosted texture overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-50 dark:opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(241,245,249,0.1) 40%, rgba(148,163,184,0.2) 100%)',
            }}
          />

          {/* ── SHINE EFFECT 1: Dynamic Spotlight Glare on Card Surface ── */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300 rounded-[14px]"
            style={{
              opacity: isHovered ? 1 : 0,
              background: `radial-gradient(280px circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.15) 30%, transparent 70%)`,
              mixBlendMode: 'overlay',
            }}
          />

          {/* ── SHINE EFFECT 2: Animated Light Beam Sweep across Card on Hover ── */}
          <div
            className={`
              absolute -top-1/2 -bottom-1/2 -left-full w-full pointer-events-none
              bg-gradient-to-r from-transparent via-white/40 dark:via-white/25 to-transparent
              transform -skew-x-25
              ${isHovered ? 'animate-card-shine opacity-100' : 'opacity-0'}
            `}
            style={{
              filter: 'blur(4px)',
            }}
          />

          {/* ── Top Beveled Chrome Specular Highlight ─────────────────── */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/50 to-transparent pointer-events-none" />

          {/* ── Ambient Underglow Accent ──────────────────────────────── */}
          <div
            className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-opacity duration-500"
            style={{
              backgroundColor: glowColor,
              opacity: isHovered ? 0.35 : 0.08,
            }}
          />

          {/* ── 3D Card Content (Pushed outward on Z-Axis) ───────────── */}
          <div
            className="relative z-10 space-y-3"
            style={{
              transform: isHovered ? 'translateZ(28px)' : 'translateZ(0px)',
              transition: isHovered ? 'transform 0.15s ease-out' : 'transform 0.45s ease-out',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
