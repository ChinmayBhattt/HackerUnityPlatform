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

  // Calibration distances for cinematic unskippable feel
  const START_BUFFER = 120; // 120px delay where screen rests unexpanded so user arrives properly
  const ZOOM_DISTANCE = 750; // Distance over which zoom/split completes
  const END_BUFFER = 150;   // 150px rest buffer where content is held expanded before scrolling down

  // High performance spring
  const smoothProgress = useSpring(progressMotion, {
    stiffness: 260,
    damping: 32,
    mass: 0.85,
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

  // Update boolean fully expanded state when progress hits ~0.95
  useEffect(() => {
    return smoothProgress.on('change', (val) => {
      setIsFullyExpanded(val >= 0.95);
    });
  }, [smoothProgress]);

  // Touch handling
  const touchStartYRef = useRef<number | null>(null);

  // Wheel and Touch interception logic with zero lag and anti-skip protection
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const handleWheel = (e: WheelEvent) => {
      const rect = section.getBoundingClientRect();
      const isAlignedAtTop = rect.top >= -25 && rect.top <= 25;
      const isInViewport = rect.top <= 50 && rect.bottom >= window.innerHeight - 50;

      if (!isInViewport) return;

      const deltaY = e.deltaY;
      // Clamp deltaY so fast scrolling cannot skip the animation in 1 tick
      const maxDelta = 40;
      const clampedDelta = Math.sign(deltaY) * Math.min(Math.abs(deltaY), maxDelta);

      const maxAccumulated = START_BUFFER + ZOOM_DISTANCE + END_BUFFER;

      // Scrolling Down
      if (deltaY > 0) {
        // Only trigger lock when section has actually arrived at the top
        if (isAlignedAtTop || rect.top <= 10) {
          if (accumulatedRef.current < maxAccumulated) {
            e.preventDefault();

            // Snap cleanly to top of section
            const currentScroll = window.scrollY;
            const targetScroll = currentScroll + rect.top;
            if (Math.abs(rect.top) > 1.5) {
              window.scrollTo({ top: targetScroll, behavior: 'instant' as ScrollBehavior });
            }

            accumulatedRef.current = Math.min(maxAccumulated, accumulatedRef.current + clampedDelta);

            // Calculate progress with initial rest buffer
            let currentProgress = 0;
            if (accumulatedRef.current > START_BUFFER) {
              currentProgress = Math.min(
                1,
                (accumulatedRef.current - START_BUFFER) / ZOOM_DISTANCE
              );
            }

            progressVal.current = currentProgress;
            progressMotion.set(currentProgress);
          }
          // If accumulatedRef reaches maxAccumulated, lock releases and user scrolls naturally down
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
          if (accumulatedRef.current > START_BUFFER) {
            currentProgress = Math.min(
              1,
              (accumulatedRef.current - START_BUFFER) / ZOOM_DISTANCE
            );
          }

          progressVal.current = currentProgress;
          progressMotion.set(currentProgress);
        }
        // If accumulatedRef is 0, user scrolls naturally up
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current === null) return;
      const currentY = e.touches[0].clientY;
      const rawDelta = touchStartYRef.current - currentY;
      const clampedDelta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 30);

      const rect = section.getBoundingClientRect();
      const isAlignedAtTop = rect.top >= -30 && rect.top <= 30;
      const isInViewport = rect.top <= 50 && rect.bottom >= window.innerHeight - 50;

      if (!isInViewport) return;

      const maxAccumulated = START_BUFFER + ZOOM_DISTANCE + END_BUFFER;

      if (rawDelta > 0 && (isAlignedAtTop || rect.top <= 10) && accumulatedRef.current < maxAccumulated) {
        e.preventDefault();
        accumulatedRef.current = Math.min(maxAccumulated, accumulatedRef.current + clampedDelta);

        let currentProgress = 0;
        if (accumulatedRef.current > START_BUFFER) {
          currentProgress = Math.min(1, (accumulatedRef.current - START_BUFFER) / ZOOM_DISTANCE);
        }

        progressVal.current = currentProgress;
        progressMotion.set(currentProgress);
        touchStartYRef.current = currentY;
      } else if (rawDelta < 0 && isAlignedAtTop && accumulatedRef.current > 0) {
        e.preventDefault();
        accumulatedRef.current = Math.max(0, accumulatedRef.current + clampedDelta);

        let currentProgress = 0;
        if (accumulatedRef.current > START_BUFFER) {
          currentProgress = Math.min(1, (accumulatedRef.current - START_BUFFER) / ZOOM_DISTANCE);
        }

        progressVal.current = currentProgress;
        progressMotion.set(currentProgress);
        touchStartYRef.current = currentY;
      }
    };

    const handleTouchEnd = () => {
      touchStartYRef.current = null;
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [progressMotion]);

  // Click / Tap to toggle expansion
  const handleToggleExpand = useCallback(() => {
    if (progressVal.current < 0.5) {
      accumulatedRef.current = START_BUFFER + ZOOM_DISTANCE;
      progressVal.current = 1;
      progressMotion.set(1);
    } else {
      accumulatedRef.current = 0;
      progressVal.current = 0;
      progressMotion.set(0);
    }
  }, [progressMotion]);

  // Derived transforms using GPU scale and translate
  const cardScale = useTransform(smoothProgress, [0, 0.92], [isMobile ? 0.58 : 0.44, 1.0]);
  const cardBorderRadius = useTransform(smoothProgress, [0, 0.9], [isMobile ? 18 : 32, 0]);

  // Split text translation: First word left, second word right
  const textTranslateX = useTransform(smoothProgress, [0, 0.75], [0, isMobile ? 100 : 90]);
  const subtitleTranslateX = useTransform(smoothProgress, [0, 0.75], [0, isMobile ? 85 : 70]);
  const textOpacity = useTransform(smoothProgress, [0, 0.5], [1, 0]);

  // Background fade
  const bgOpacity = useTransform(smoothProgress, [0, 0.75], [1, 0.06]);

  // Dark overlay
  const cardDarkOverlay = useTransform(smoothProgress, [0.35, 0.85], [0.15, 0.82]);

  // Revealed content animation
  const contentOpacity = useTransform(smoothProgress, [0.75, 0.96], [0, 1]);
  const contentY = useTransform(smoothProgress, [0.75, 0.96], [30, 0]);
  const contentScale = useTransform(smoothProgress, [0.75, 0.96], [0.96, 1]);

  const words = title ? title.trim().split(' ') : [];
  const firstWord = words[0] || '';
  const restOfTitle = words.slice(1).join(' ');

  return (
    <div
      ref={sectionRef}
      className="relative w-full h-[100dvh] min-h-[580px] max-h-[1080px] overflow-hidden bg-[#05070f] flex items-center justify-center select-none"
      id="campus-ambassador"
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
        className="relative z-10 w-full h-full overflow-hidden flex items-center justify-center origin-center cursor-default transform-gpu"
        style={{
          scale: cardScale,
          borderRadius: cardBorderRadius,
          boxShadow: isMobile
            ? '0 0 35px rgba(0, 153, 230, 0.35)'
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

      {/* ─── Big Splitting Titles (Slides Left & Right) ───────────────── */}
      <motion.div
        className={`absolute inset-0 z-15 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 md:gap-6 pointer-events-none px-3 transform-gpu ${
          textBlend ? 'mix-blend-difference' : ''
        }`}
        style={{ opacity: textOpacity }}
      >
        {/* Left word: moves far left */}
        <motion.h2
          className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-sky-300 drop-shadow-[0_2px_15px_rgba(239,68,68,0.7)] uppercase text-center"
          style={{
            transform: useTransform(textTranslateX, (val) => `translateX(-${val}vw)`),
          }}
        >
          {firstWord}
        </motion.h2>

        {/* Right word: moves far right */}
        <motion.h2
          className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-300 drop-shadow-[0_2px_15px_rgba(0,153,230,0.7)] uppercase text-center"
          style={{
            transform: useTransform(textTranslateX, (val) => `translateX(${val}vw)`),
          }}
        >
          {restOfTitle}
        </motion.h2>
      </motion.div>

      {/* ─── Subtitle & Scroll Hint (Below Image, slides Left & Right) ── */}
      <motion.div
        className="absolute z-20 bottom-3 sm:bottom-6 md:bottom-8 inset-x-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 pointer-events-none px-4 transform-gpu"
        style={{ opacity: textOpacity }}
      >
        {date && (
          <motion.div
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-red-950/85 border border-red-500/50 shadow-md backdrop-blur-sm"
            style={{
              transform: useTransform(
                subtitleTranslateX,
                (val) => `translateX(calc(-${isMobile ? 18 : 36}px - ${val}vw))`
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
                (val) => `translateX(calc(${isMobile ? 18 : 36}px + ${val}vw))`
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
