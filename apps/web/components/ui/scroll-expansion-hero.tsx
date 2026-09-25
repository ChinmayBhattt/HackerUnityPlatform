'use client';

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';

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

  // Native Framer Motion scroll tracker attached to container in DOM (0ms latency, zero lag)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Track expansion state efficiently without unnecessary re-renders
  useEffect(() => {
    return scrollYProgress.on('change', (val) => {
      currentProgressRef.current = val;
      const expanded = val >= 0.82;
      setIsFullyExpanded((prev) => (prev !== expanded ? expanded : prev));
    });
  }, [scrollYProgress]);

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

  // GPU-accelerated transforms
  const cardScale = useTransform(scrollYProgress, [0, 0.78], [0.44, 1.0]);
  const cardBorderRadius = useTransform(scrollYProgress, [0, 0.75], [24, 0]);

  // Split text translation on GPU compositor thread (x property)
  const textTranslateLeft = useTransform(scrollYProgress, [0, 0.55], ['0vw', '-75vw']);
  const textTranslateRight = useTransform(scrollYProgress, [0, 0.55], ['0vw', '75vw']);
  const textOpacity = useTransform(scrollYProgress, [0, 0.42], [1, 0]);

  // Subtitle translation
  const subtitleTranslateLeft = useTransform(
    scrollYProgress,
    [0, 0.5],
    ['-36px', 'calc(-36px - 60vw)']
  );
  const subtitleTranslateRight = useTransform(
    scrollYProgress,
    [0, 0.5],
    ['36px', 'calc(36px + 60vw)']
  );

  // Background fade
  const bgOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0.05]);

  // Dark overlay on card
  const cardDarkOverlay = useTransform(scrollYProgress, [0.3, 0.75], [0.15, 0.82]);

  // Revealed content animation
  const contentOpacity = useTransform(scrollYProgress, [0.7, 0.88], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.7, 0.88], [24, 0]);
  const contentScale = useTransform(scrollYProgress, [0.7, 0.88], [0.97, 1]);

  const words = title ? title.trim().split(' ') : [];
  const firstWord = words[0] || '';
  const restOfTitle = words.slice(1).join(' ');

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[220vh] bg-[#05070f]"
    >
      <div className="sticky top-0 w-full h-screen min-h-[560px] overflow-hidden bg-[#05070f] flex items-center justify-center select-none">
        {/* ─── Background Layer (Hackathon Arena) ────────────────────────── */}
        <motion.div
          className="absolute inset-0 z-0 h-full w-full pointer-events-none transform-gpu will-change-transform"
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
          className="relative z-10 w-full h-full overflow-hidden flex items-center justify-center origin-center cursor-pointer transform-gpu will-change-transform"
          style={{
            scale: cardScale,
            borderRadius: cardBorderRadius,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 30px rgba(0, 153, 230, 0.15)',
          }}
        >
          {/* Subtle border glow on card */}
          <motion.div
            className="absolute inset-0 border border-sky-400/30 z-20 pointer-events-none rounded-[inherit]"
            style={{
              opacity: useTransform(scrollYProgress, [0, 0.75], [1, 0]),
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

        {/* ─── Big Splitting Titles: Hacker's Unity Clean Brand Gradient ── */}
        <motion.div
          className={`absolute inset-0 z-15 flex flex-row items-center justify-between sm:justify-center gap-2 sm:gap-6 md:gap-8 pointer-events-none px-3 sm:px-8 transform-gpu ${
            textBlend ? 'mix-blend-difference' : ''
          }`}
          style={{ opacity: textOpacity }}
        >
          {/* Left word (CAMPUS): Hacker's Unity Clean Cyan Gradient */}
          <motion.h2
            className="text-xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight uppercase text-left sm:text-center metal-text-cyan select-none will-change-transform"
            style={{
              x: textTranslateLeft,
            }}
          >
            {firstWord}
          </motion.h2>

          {/* Right word (AMBASSADOR): Hacker's Unity Clean Orange Gradient */}
          <motion.h2
            className="text-xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight uppercase text-right sm:text-center metal-text-orange select-none will-change-transform"
            style={{
              x: textTranslateRight,
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
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-slate-950/90 border border-[#ff7800]/40 shadow-md backdrop-blur-sm will-change-transform"
              style={{
                x: subtitleTranslateLeft,
              }}
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#ff7800]" />
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-orange-200">
                {date}
              </span>
            </motion.div>
          )}

          {scrollToExpand && (
            <motion.div
              onClick={handleToggleExpand}
              className="flex items-center gap-2 px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full bg-slate-950/95 border border-sky-400/40 shadow-lg backdrop-blur-sm pointer-events-auto cursor-pointer active:scale-95 transition-transform will-change-transform"
              style={{
                x: subtitleTranslateRight,
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-sky-200 tracking-wide">
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
