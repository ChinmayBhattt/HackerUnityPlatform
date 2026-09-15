'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

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
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullyExpanded, setIsFullyExpanded] = useState(false);

  // Accumulated scroll distance in pixels
  const accumulatedRef = useRef(0);
  const progressVal = useRef(0);
  const progressMotion = useMotionValue(0);

  // Calibration distances tuned for responsive mobile & desktop
  const START_BUFFER = isMobile ? 40 : 120;
  const ZOOM_DISTANCE = isMobile ? 260 : 750;
  const END_BUFFER = isMobile ? 60 : 150;

  // Ultra-fluid 60fps spring physics
  const smoothProgress = useSpring(progressMotion, {
    stiffness: isMobile ? 320 : 260,
    damping: isMobile ? 28 : 32,
    mass: 0.8,
    restDelta: 0.001,
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update fully expanded boolean state
  useEffect(() => {
    return smoothProgress.on('change', (val) => {
      setIsFullyExpanded(val >= 0.94);
    });
  }, [smoothProgress]);

  // Wheel interception logic for desktop with zero lag and anti-skip protection
  useEffect(() => {
    // Only intercept scroll expansion on desktop screens (>= 768px)
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return;
    }

    const section = sectionRef.current;
    if (!section) return;

    const startBuffer = 120;
    const zoomDistance = 750;
    const endBuffer = 150;
    const maxAccumulated = startBuffer + zoomDistance + endBuffer;

    const handleWheel = (e: WheelEvent) => {
      const rect = section.getBoundingClientRect();
      const isAlignedAtTop = rect.top >= -25 && rect.top <= 25;
      const isInViewport = rect.top <= 50 && rect.bottom >= window.innerHeight - 50;

      if (!isInViewport) return;

      const deltaY = e.deltaY;
      // Clamp deltaY so fast flick cannot skip the animation in 1 tick
      const maxDelta = 40;
      const clampedDelta = Math.sign(deltaY) * Math.min(Math.abs(deltaY), maxDelta);

      // Scrolling Down
      if (deltaY > 0) {
        if (isAlignedAtTop || rect.top <= 10) {
          if (accumulatedRef.current < maxAccumulated) {
            e.preventDefault();

            const currentScroll = window.scrollY;
            const targetScroll = currentScroll + rect.top;
            if (Math.abs(rect.top) > 1.5) {
              window.scrollTo({ top: targetScroll, behavior: 'instant' as ScrollBehavior });
            }

            accumulatedRef.current = Math.min(maxAccumulated, accumulatedRef.current + clampedDelta);

            let currentProgress = 0;
            if (accumulatedRef.current > startBuffer) {
              currentProgress = Math.min(
                1,
                (accumulatedRef.current - startBuffer) / zoomDistance
              );
            }

            progressVal.current = currentProgress;
            progressMotion.set(currentProgress);
          }
        }
      }
      // Scrolling Up
      else if (deltaY < 0) {
        if (isAlignedAtTop && accumulatedRef.current > 0) {
          e.preventDefault();

          const currentScroll = window.scrollY;
          const targetScroll = currentScroll + rect.top;
          if (Math.abs(rect.top) > 1.5) {
            window.scrollTo({ top: targetScroll, behavior: 'instant' as ScrollBehavior });
          }

          accumulatedRef.current = Math.max(0, accumulatedRef.current + clampedDelta);

          let currentProgress = 0;
          if (accumulatedRef.current > startBuffer) {
            currentProgress = Math.min(
              1,
              (accumulatedRef.current - startBuffer) / zoomDistance
            );
          }

          progressVal.current = currentProgress;
          progressMotion.set(currentProgress);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [progressMotion]);

  // Click / Tap to toggle expansion instantly with smooth 60fps spring
  const handleToggleExpand = useCallback(() => {
    const startBuffer = isMobile ? 40 : 120;
    const zoomDistance = isMobile ? 260 : 750;
    if (progressVal.current < 0.5) {
      accumulatedRef.current = startBuffer + zoomDistance;
      progressVal.current = 1;
      progressMotion.set(1);
    } else {
      accumulatedRef.current = 0;
      progressVal.current = 0;
      progressMotion.set(0);
    }
  }, [progressMotion, isMobile]);

  // Derived transforms using GPU scale and translate
  const cardScale = useTransform(smoothProgress, [0, 0.92], [isMobile ? 0.48 : 0.44, 1.0]);
  const cardBorderRadius = useTransform(smoothProgress, [0, 0.9], [isMobile ? 18 : 32, 0]);

  // Split text translation: First word left, second word right
  const textTranslateX = useTransform(smoothProgress, [0, 0.75], [0, isMobile ? 90 : 90]);
  const subtitleTranslateX = useTransform(smoothProgress, [0, 0.75], [0, isMobile ? 80 : 70]);
  const textOpacity = useTransform(smoothProgress, [0, 0.5], [1, 0]);

  // Background fade
  const bgOpacity = useTransform(smoothProgress, [0, 0.75], [1, 0.06]);

  // Dark overlay
  const cardDarkOverlay = useTransform(smoothProgress, [0.35, 0.85], [0.15, 0.82]);

  // Revealed content animation
  const contentOpacity = useTransform(smoothProgress, [0.75, 0.96], [0, 1]);
  const contentY = useTransform(smoothProgress, [0.75, 0.96], [25, 0]);
  const contentScale = useTransform(smoothProgress, [0.75, 0.96], [0.96, 1]);

  const words = title ? title.trim().split(' ') : [];
  const firstWord = words[0] || '';
  const restOfTitle = words.slice(1).join(' ');

  return (
    <div
      ref={sectionRef}
      className="relative w-full h-[100dvh] min-h-[560px] max-h-[1080px] overflow-hidden bg-[#05070f] flex items-center justify-center select-none touch-pan-y"
    >
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
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/80 via-transparent to-red-950/70 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-transparent to-[#05070f]/90 pointer-events-none" />
      </motion.div>

      {/* ─── Center Photo Card (Zooms Forward to Front) ───────────────── */}
      <motion.div
        onClick={!isFullyExpanded ? handleToggleExpand : undefined}
        className="relative z-10 w-full h-full overflow-hidden flex items-center justify-center origin-center cursor-pointer transform-gpu"
        style={{
          scale: cardScale,
          borderRadius: cardBorderRadius,
          boxShadow: isMobile
            ? '0 0 25px rgba(0, 153, 230, 0.3)'
            : '0 0 70px rgba(0, 153, 230, 0.35), 0 0 100px rgba(239, 68, 68, 0.25)',
        }}
      >
        {/* Border glow on card */}
        <motion.div
          className="absolute inset-0 border-2 border-sky-400/40 z-20 pointer-events-none rounded-[inherit]"
          style={{
            opacity: useTransform(smoothProgress, [0, 0.8], [1, 0]),
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

      {/* ─── Big Splitting Titles (Slides Left & Right on ALL screens) ── */}
      <motion.div
        className={`absolute inset-0 z-15 flex flex-row items-center justify-between sm:justify-center gap-2 sm:gap-6 md:gap-8 pointer-events-none px-3 sm:px-8 transform-gpu ${
          textBlend ? 'mix-blend-difference' : ''
        }`}
        style={{ opacity: textOpacity }}
      >
        {/* Left word: moves far left */}
        <motion.h2
          className="text-xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-sky-300 drop-shadow-[0_2px_15px_rgba(239,68,68,0.7)] uppercase text-left sm:text-center"
          style={{
            transform: useTransform(textTranslateX, (val) => `translateX(-${val}vw)`),
          }}
        >
          {firstWord}
        </motion.h2>

        {/* Right word: moves far right */}
        <motion.h2
          className="text-xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-300 drop-shadow-[0_2px_15px_rgba(0,153,230,0.7)] uppercase text-right sm:text-center"
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
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-red-950/90 border border-red-500/50 shadow-md backdrop-blur-sm"
            style={{
              transform: useTransform(
                subtitleTranslateX,
                (val) => `translateX(calc(-${isMobile ? 22 : 36}px - ${val}vw))`
              ),
            }}
          >
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400 animate-ping" />
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-red-200">
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
                (val) => `translateX(calc(${isMobile ? 22 : 36}px + ${val}vw))`
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
  );
}

export default ScrollExpandMedia;
