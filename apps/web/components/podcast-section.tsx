'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Play,
  X,
  ExternalLink,
  Sparkles,
  Radio,
  ArrowRight,
  Tv,
} from 'lucide-react';
import { FaAmazon, FaMicrosoft, FaYoutube } from 'react-icons/fa6';
import { SiIeee } from 'react-icons/si';

export interface PodcastEpisode {
  id: string;
  name: string;
  designation: string;
  company: string;
  companyType: 'amazon' | 'microsoft' | 'tcs' | 'macys' | 'ieee' | 'mphasis' | 'ssc' | 'ai';
  image: string;
  youtubeUrl: string;
  videoId: string;
  title: string;
  tagline: string;
  tags: string[];
}

const PODCAST_EPISODES: PodcastEpisode[] = [
  {
    id: 'ep-amazon',
    name: 'Mihir Shelar',
    designation: 'Technical Manager',
    company: 'Amazon',
    companyType: 'amazon',
    image: '/podcasts/mihirshelar.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=-A9QjJcd32k&t=315s',
    videoId: '-A9QjJcd32k',
    title: 'Amazon Technical Manager Reveals Industry Secrets',
    tagline: 'Building technology at hyperscale, engineering leadership, and high-impact career growth.',
    tags: ['Cloud & Scale', 'Leadership', 'Amazon Culture'],
  },
  {
    id: 'ep-microsoft',
    name: 'Krishna Kishor Tirupati',
    designation: 'Senior Software Engineer',
    company: 'Microsoft',
    companyType: 'microsoft',
    image: '/podcasts/kirshna.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=cS_8kLIzpHk',
    videoId: 'cS_8kLIzpHk',
    title: 'From Campus to Microsoft: Career Journey & Tech Growth',
    tagline: 'Placement strategies, mastering software engineering craft, and skills that matter in big tech.',
    tags: ['Big Tech', 'Software Engineering', 'Campus Placements'],
  },
  {
    id: 'ep-tcs',
    name: 'Abhijit Roy',
    designation: 'Solution Architect',
    company: 'Tata Consultancy Services',
    companyType: 'tcs',
    image: '/podcasts/abhijitroy.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=pdqg4f1ijYM',
    videoId: 'pdqg4f1ijYM',
    title: 'AI, Innovation & The Future of Technology',
    tagline: 'Artificial Intelligence, cloud transformation, and real-world tech innovation trends.',
    tags: ['Artificial Intelligence', 'Cloud', 'Innovation'],
  },
  {
    id: 'ep-macys',
    name: 'Ankur Bhatnagar',
    designation: 'Staff Software Engineer',
    company: "Macy's Tech (Ex-Accenture)",
    companyType: 'macys',
    image: '/podcasts/ankur.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=3eFj4r4x9AI',
    videoId: '3eFj4r4x9AI',
    title: 'The Truth About Becoming a Staff Software Engineer',
    tagline: 'Demystifying the staff engineer path, technical leadership, and engineering excellence.',
    tags: ['Staff Engineering', 'Tech Leadership', 'Career Growth'],
  },
  {
    id: 'ep-mphasis',
    name: 'Eshaan Jain',
    designation: 'Senior Product Manager',
    company: 'Mphasis Silverline (Ex-Amazon)',
    companyType: 'mphasis',
    image: '/podcasts/eshaan.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=dMZYpdd7XHI',
    videoId: 'dMZYpdd7XHI',
    title: 'No One Talks About This! Product Management Secrets',
    tagline: 'Realities of product management, building with engineering teams, and high-velocity shipping.',
    tags: ['Product Management', 'Ex-Amazon', 'Product Strategy'],
  },
  {
    id: 'ep-ssc',
    name: 'Surya Rao R',
    designation: 'Lead Software Engineer',
    company: 'SS&C Technologies',
    companyType: 'ssc',
    image: '/podcasts/surya_roy.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=KMftFbyMrJc',
    videoId: 'KMftFbyMrJc',
    title: 'Engineering Leadership & Scaling High-Impact Systems',
    tagline: 'Transitioning from contributor to leader, designing resilient architectures, and mentoring.',
    tags: ['Engineering Leadership', 'System Design', 'FinTech'],
  },
  {
    id: 'ep-ieee',
    name: 'Ratna Kumar Bonagiri',
    designation: 'Staff Engineer & IEEE Senior Leader',
    company: "Macy's / IEEE",
    companyType: 'ieee',
    image: '/podcasts/ratnakumar.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=Ka_9ZWvTJjU',
    videoId: 'Ka_9ZWvTJjU',
    title: 'Innovation, Leadership & Community-Driven Tech Growth',
    tagline: 'How community leadership and continuous learning build resilience and long-term career success.',
    tags: ['IEEE Leader', 'Community', 'Tech Innovation'],
  },
  {
    id: 'ep-ai',
    name: 'Ather Husain',
    designation: 'Principal Engineer & Tech Lead',
    company: 'Enterprise Cloud & AI',
    companyType: 'ai',
    image: '/podcasts/arther.jpg',
    youtubeUrl: 'https://www.youtube.com/watch?v=jm_4cse3wsE',
    videoId: 'jm_4cse3wsE',
    title: 'Agent RAG, LLMs & What Every AI Engineer Must Understand',
    tagline: 'Agentic workflows, RAG architectures, enterprise microservices, and modern generative AI.',
    tags: ['Agentic AI', 'RAG & LLMs', 'Enterprise Cloud'],
  },
];

function CompanyBadge({ type, name }: { type: PodcastEpisode['companyType']; name: string }) {
  if (type === 'amazon') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 font-bold text-[11px]">
        <FaAmazon className="w-3.5 h-3.5 text-[#ff9900]" />
        <span>{name}</span>
      </span>
    );
  }

  if (type === 'microsoft') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-700 font-bold text-[11px]">
        <span className="grid grid-cols-2 gap-0.5 w-3 h-3">
          <span className="bg-[#f25022] rounded-[1px]" />
          <span className="bg-[#7fba00] rounded-[1px]" />
          <span className="bg-[#00a4ef] rounded-[1px]" />
          <span className="bg-[#ffb900] rounded-[1px]" />
        </span>
        <span>{name}</span>
      </span>
    );
  }

  if (type === 'ieee') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700 font-bold text-[11px]">
        <SiIeee className="w-4 h-4 text-[#00629b]" />
        <span>{name}</span>
      </span>
    );
  }

  if (type === 'tcs') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 font-bold text-[11px]">
        <span className="w-2 h-2 rounded-full bg-indigo-600" />
        <span>{name}</span>
      </span>
    );
  }

  if (type === 'macys') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 font-bold text-[11px]">
        <span className="text-rose-600 font-black text-xs leading-none">★</span>
        <span>{name}</span>
      </span>
    );
  }

  if (type === 'mphasis') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-700 font-bold text-[11px]">
        <span className="w-2 h-2 rounded-full bg-violet-600" />
        <span>{name}</span>
      </span>
    );
  }

  if (type === 'ssc') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 font-bold text-[11px]">
        <span className="w-2 h-2 rounded-full bg-emerald-600" />
        <span>{name}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-700 font-bold text-[11px]">
      <Sparkles className="w-3 h-3 text-[#0099e6]" />
      <span>{name}</span>
    </span>
  );
}

export function PodcastSection() {
  const [activeVideo, setActiveVideo] = useState<PodcastEpisode | null>(null);

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Beyond The Mic • Industry Insider</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Learn from Industry Leaders & Tech Insiders
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            Real-world career journeys, engineering leadership, and insider secrets from senior
            engineers and leaders at <strong className="text-slate-900">Amazon, Microsoft, Macy&apos;s, TCS, and IEEE</strong>.
          </p>
        </div>

        <a
          href="https://www.youtube.com/@HackerUnity/videos"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer shrink-0 self-start md:self-auto group"
        >
          <FaYoutube className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
          <span>Subscribe on YouTube</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* ─── Podcast Cards Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PODCAST_EPISODES.map((ep) => (
          <div
            key={ep.id}
            className="group rounded-3xl bg-white border border-slate-200/90 hover:border-[#0099e6]/50 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
          >
            {/* Speaker Image Thumbnail with Play Button */}
            <div
              onClick={() => setActiveVideo(ep)}
              className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden cursor-pointer"
            >
              <Image
                src={ep.image}
                alt={ep.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

              {/* Play button badge */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-115 group-hover:bg-red-600 transition-all duration-300">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>

              {/* Watch Video hint */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-bold">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs">
                  <Tv className="w-3 h-3 text-red-400" />
                  Watch Podcast
                </span>
                <span className="text-white/80 font-mono text-[10px]">HD 1080p</span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                {/* Company Logo / Badge */}
                <CompanyBadge type={ep.companyType} name={ep.company} />

                {/* Speaker Name & Designation */}
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#0099e6] transition-colors">
                    {ep.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {ep.designation}
                  </p>
                </div>

                {/* Episode Topic */}
                <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2">
                  {ep.tagline}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {ep.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-600 font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveVideo(ep)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0099e6] hover:text-[#0077b6] cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play Episode</span>
                </button>

                <a
                  href={ep.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Open in YouTube"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── YouTube Channel Promo Banner ──────────────────────── */}
      <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
        <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
          <div className="w-14 h-14 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center shrink-0">
            <FaYoutube className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-black tracking-tight">
              Watch All Episodes on @HackerUnity
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Catch in-depth talks on Agentic AI, Product Management, Big Tech interviews, and full episodes with industry leaders.
            </p>
          </div>
        </div>

        <a
          href="https://www.youtube.com/@HackerUnity/videos"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-black transition-all shadow-xs shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <span>Explore All Videos</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* ─── Interactive Video Player Modal ────────────────────── */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 truncate">
                <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-slate-700">
                  <Image
                    src={activeVideo.image}
                    alt={activeVideo.name}
                    fill
                    className="object-cover object-top"
                  />
                </div>
                <div className="truncate">
                  <h3 className="text-sm font-bold text-white truncate">
                    {activeVideo.title}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {activeVideo.name} • {activeVideo.designation} at {activeVideo.company}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeVideo.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FaYoutube className="w-3.5 h-3.5" />
                  <span>YouTube</span>
                </a>
                <button
                  type="button"
                  onClick={() => setActiveVideo(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Embedded YouTube Player */}
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.videoId}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>

            {/* Modal Footer Info */}
            <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="text-slate-300 font-medium">
                  {activeVideo.tagline}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeVideo.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px] font-mono"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
