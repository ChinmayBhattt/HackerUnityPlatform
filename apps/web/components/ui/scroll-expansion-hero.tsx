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
  scrollToExpand,
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
    stiffness: 260,
    damping: 32,
    mass: 0.5,
    restDelta: 0.001,
  });

  // Track expansion state for pointer interactions
  useEffect(() => {
    return smoothProgress.on('change', (val) => {
      currentProgressRef.current = val;
      const expanded = val >= 0.82;
      setIsFullyExpanded((prev) => (prev !== expanded ? expanded : prev));
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

  // Split text translation: First word far left, second word far right
  const textTranslateLeft = useTransform(smoothProgress, [0, 0.55], ['0vw', '-85vw']);
  const textTranslateRight = useTransform(smoothProgress, [0, 0.55], ['0vw', '85vw']);
  const textOpacity = useTransform(smoothProgress, [0, 0.4], [1, 0]);

  // Subtitle/badge fade and exit translation
  const badgeY = useTransform(smoothProgress, [0, 0.35], [0, 30]);
  const badgeOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);

  // Background fade
  const bgOpacity = useTransform(smoothProgress, [0, 0.65], [1, 0.05]);

  // Rich dark overlay on card for crystal-clear readability when expanded
  const cardDarkOverlay = useTransform(smoothProgress, [0.25, 0.75], [0.15, 0.94]);

  // Revealed content animation
  const contentOpacity = useTransform(smoothProgress, [0.68, 0.88], [0, 1]);
  const contentY = useTransform(smoothProgress, [0.68, 0.88], [35, 0]);
  const contentScale = useTransform(smoothProgress, [0.68, 0.88], [0.95, 1]);

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
            className="object-cover object-center"
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
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 153, 230, 0.18)',
          }}
        >
          {/* Subtle border glow on card */}
          <motion.div
            className="absolute inset-0 border border-sky-400/30 z-20 pointer-events-none rounded-[inherit]"
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
              className="object-cover object-center"
              priority
              sizes="100vw"
            />
          )}

          {/* Darkening overlays for high-contrast text readability */}
          <motion.div
            className="absolute inset-0 bg-[#05070f] z-15 pointer-events-none"
            style={{ opacity: cardDarkOverlay }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-slate-950/85 to-[#05070f]/90 z-15 pointer-events-none"
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

        {/* ─── Big Splitting Titles: Hacker's Unity Clean Brand Gradient ── */}
        <motion.div
          className={`absolute inset-0 z-15 flex flex-row items-center justify-between sm:justify-center gap-2 sm:gap-6 md:gap-8 pointer-events-none px-3 sm:px-8 transform-gpu ${
            textBlend ? 'mix-blend-difference' : ''
          }`}
          style={{ opacity: textOpacity }}
        >
          {/* Left word (CAMPUS): Hacker's Unity Clean Cyan Gradient */}
          <motion.h2
            className="text-xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight uppercase text-left sm:text-center metal-text-cyan select-none"
            style={{
              x: textTranslateLeft,
            }}
          >
            {firstWord}
          </motion.h2>

          {/* Right word (AMBASSADOR): Hacker's Unity Clean Orange Gradient */}
          <motion.h2
            className="text-xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight uppercase text-right sm:text-center metal-text-orange select-none"
            style={{
              x: textTranslateRight,
            }}
          >
            {restOfTitle}
          </motion.h2>
        </motion.div>

        {/* ─── Subtitle Badge: Centered, Elevated & Animated ── */}
        {date && (
          <motion.div
            className="absolute z-20 bottom-8 sm:bottom-12 md:bottom-16 inset-x-0 flex items-center justify-center pointer-events-none px-4 transform-gpu"
            style={{
              opacity: badgeOpacity,
              y: badgeY,
            }}
          >
            <motion.div
              onClick={handleToggleExpand}
              animate={{
                y: [0, -6, 0],
                boxShadow: [
                  '0 4px 20px -2px rgba(255, 120, 0, 0.25), 0 0 15px rgba(255, 120, 0, 0.15)',
                  '0 10px 30px -2px rgba(255, 120, 0, 0.4), 0 0 25px rgba(255, 120, 0, 0.3)',
                  '0 4px 20px -2px rgba(255, 120, 0, 0.25), 0 0 15px rgba(255, 120, 0, 0.15)',
                ],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="group flex items-center gap-2 sm:gap-2.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-slate-950/90 border border-[#ff7800]/50 backdrop-blur-md cursor-pointer pointer-events-auto select-none transition-colors hover:border-[#ff7800]"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff7800] opacity-80" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-[#ff7800] to-[#ffa040]" />
              </span>
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-orange-200 via-white to-orange-300 group-hover:from-white group-hover:to-orange-200 transition-all">
                {date}
              </span>
              <span className="inline-block transition-transform duration-300 group-hover:translate-y-0.5 text-[#ff7800] text-xs">
                ↓
              </span>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default ScrollExpandMedia;
