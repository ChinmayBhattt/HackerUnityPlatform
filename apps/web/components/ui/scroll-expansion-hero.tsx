'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import Image from 'next/image';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

export interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

export function ScrollExpandMedia({
  mediaType = 'image',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title = 'CAMPUS AMBASSADOR',
  date = 'Lead Your College Chapter',
  scrollToExpand = 'Scroll down to expand',
  textBlend = false,
  children,
}: ScrollExpandMediaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullyExpanded, setIsFullyExpanded] = useState(false);
  const currentProgressRef = useRef(0);

  // Native Framer Motion scroll tracker attached to container in DOM
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Silky 60fps spring physics for natural momentum across all scroll speeds
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 34,
    mass: 0.5,
    restDelta: 0.001,
  });

  // Track expansion state for pointer interactions
  useEffect(() => {
    return smoothProgress.on('change', (val) => {
      currentProgressRef.current = val;
      setIsFullyExpanded(val >= 0.85);
    });
  }, [smoothProgress]);

  // Click / Tap to toggle expansion smoothly
  const handleToggleExpand = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const containerTop = window.scrollY + rect.top;
    const maxScroll = rect.height - window.innerHeight;

    if (currentProgressRef.current < 0.5) {
      window.scrollTo({
        top: containerTop + maxScroll * 0.88,
        behavior: 'smooth',
      });
    } else {
      window.scrollTo({
        top: containerTop,
        behavior: 'smooth',
      });
    }
  }, []);

  // Derived transforms using GPU scale and translate
  const cardScale = useTransform(smoothProgress, [0, 0.78], [0.44, 1.0]);
  const cardBorderRadius = useTransform(smoothProgress, [0, 0.75], [32, 0]);

  // Split text translation: First word left, second word right
  const textTranslateX = useTransform(smoothProgress, [0, 0.55], [0, 85]);
  const subtitleTranslateX = useTransform(smoothProgress, [0, 0.5], [0, 70]);
  const textOpacity = useTransform(smoothProgress, [0, 0.4], [1, 0]);

  // Background fade
  const bgOpacity = useTransform(smoothProgress, [0, 0.65], [1, 0.05]);

  // Dark overlay on card
  const cardDarkOverlay = useTransform(smoothProgress, [0.3, 0.75], [0.15, 0.82]);

  // Revealed content animation
  const contentOpacity = useTransform(smoothProgress, [0.7, 0.88], [0, 1]);
  const contentY = useTransform(smoothProgress, [0.7, 0.88], [30, 0]);
  const contentScale = useTransform(smoothProgress, [0.7, 0.88], [0.96, 1]);

  const words = title ? title.trim().split(' ') : [];
  const firstWord = words[0] || '';
  const restOfTitle = words.slice(1).join(' ');

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[240vh] bg-[#05070f]"
    >
      <div className="sticky top-0 w-full h-screen min-h-[560px] overflow-hidden bg-[#05070f] flex items-center justify-center select-none">
        {/* ─── Background Layer (Hackathon Arena) ────────────────────────── */}
        <motion.div
          className="absolute inset-0 z-0 h-full w-full pointer-events-none transform-gpu"
          style={{ opacity: bgOpacity }}
        >
          <Image
            src={bgImageSrc}
            alt="Hackathon Background Arena"
            fill
            className="object-cover object-center filter brightness-[0.6] contrast-[1.15]"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-sky-950/80 via-transparent to-amber-950/70 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-transparent to-[#05070f]/90 pointer-events-none" />
        </motion.div>

        {/* ─── Center Photo Card (Zooms Forward to Front) ───────────────── */}
        <motion.div
          onClick={!isFullyExpanded ? handleToggleExpand : undefined}
          className="relative z-10 w-full h-full overflow-hidden flex items-center justify-center origin-center cursor-pointer transform-gpu"
          style={{
            scale: cardScale,
            borderRadius: cardBorderRadius,
            boxShadow: '0 0 70px rgba(0, 153, 230, 0.4), 0 0 100px rgba(255, 120, 0, 0.35)',
          }}
        >
          {/* Border glow on card */}
          <motion.div
            className="absolute inset-0 border-2 border-sky-400/40 z-20 pointer-events-none rounded-[inherit]"
            style={{
              opacity: useTransform(smoothProgress, [0, 0.75], [1, 0]),
            }}
          />

          {/* Central Media */}
          {mediaType === 'video' ? (
            <video
              src={mediaSrc}
              poster={posterSrc}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={mediaSrc}
              alt={title || 'Hackathon Builders'}
              fill
              className="object-cover object-center filter brightness-[0.95] contrast-[1.05]"
              priority
              sizes="100vw"
            />
          )}

          {/* Darkening overlay for readability */}
          <motion.div
            className="absolute inset-0 bg-black z-15 pointer-events-none"
            style={{ opacity: cardDarkOverlay }}
          />

          {/* ─── Fully Expanded Content: "( Become Campus Ambassador )" ──── */}
          <motion.div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center p-2 sm:p-6 lg:p-10 max-h-[100dvh] overflow-y-auto transform-gpu"
            style={{
              opacity: contentOpacity,
              y: contentY,
              scale: contentScale,
              pointerEvents: isFullyExpanded ? 'auto' : 'none',
            }}
          >
            {children}
          </motion.div>
        </motion.div>

        {/* ─── Big Splitting Titles: Hacker's Unity Metallic Chrome Text ── */}
        <motion.div
          className={`absolute inset-0 z-15 flex flex-row items-center justify-between sm:justify-center gap-2 sm:gap-6 md:gap-8 pointer-events-none px-3 sm:px-8 transform-gpu ${
            textBlend ? 'mix-blend-difference' : ''
          }`}
          style={{ opacity: textOpacity }}
        >
          {/* Left word (CAMPUS): Hacker's Unity Cyan Metallic Chrome */}
          <motion.h2
            className="text-xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight uppercase text-left sm:text-center metal-text-cyan"
            style={{
              transform: useTransform(textTranslateX, (val) => `translateX(-${val}vw)`),
            }}
          >
            {firstWord}
          </motion.h2>

          {/* Right word (AMBASSADOR): Hacker's Unity Orange Metallic Chrome */}
          <motion.h2
            className="text-xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight uppercase text-right sm:text-center metal-text-orange"
            style={{
              transform: useTransform(textTranslateX, (val) => `translateX(${val}vw)`),
            }}
          >
            {restOfTitle}
          </motion.h2>
        </motion.div>

        {/* ─── Subtitle & Scroll Hint (Below Image, Staggered Left & Right) ── */}
        <motion.div
          className="absolute z-20 bottom-5 sm:bottom-7 md:bottom-8 inset-x-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 pointer-events-none px-4 transform-gpu"
          style={{ opacity: textOpacity }}
        >
          {date && (
            <motion.div
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-slate-950/90 border border-[#ff7800]/50 shadow-md shadow-orange-500/10 backdrop-blur-sm"
              style={{
                transform: useTransform(
                  subtitleTranslateX,
                  (val) => `translateX(calc(-36px - ${val}vw))`
                ),
              }}
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#ff7800] animate-ping" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-orange-200">
                {date}
              </span>
            </motion.div>
          )}

          {scrollToExpand && (
            <motion.div
              onClick={handleToggleExpand}
              className="flex items-center gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-slate-950/95 border border-sky-400/50 shadow-lg backdrop-blur-sm pointer-events-auto cursor-pointer active:scale-95 transition-transform"
              style={{
                transform: useTransform(
                  subtitleTranslateX,
                  (val) => `translateX(calc(36px + ${val}vw))`
                ),
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-sky-200 tracking-wide">
                {scrollToExpand}
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default ScrollExpandMedia;
