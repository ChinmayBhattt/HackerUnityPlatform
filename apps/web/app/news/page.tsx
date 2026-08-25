'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  Search,
  Calendar,
  User,
  ArrowRight,
  Sparkles,
  Flame,
  Filter,
  Tag,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { NewsArticle, NewsCategory } from '@hackers-unity/shared-types';
import { fetchPublishedNews, getNewsCategoryLabel, getNewsCategoryColor } from '@/lib/news-service';
import { formatDate } from '@/lib/utils';

const CATEGORY_TABS: { id: string; label: string; category?: NewsCategory }[] = [
  { id: 'all', label: 'All Updates' },
  { id: 'hackathons', label: 'Hackathons', category: NewsCategory.HACKATHONS },
  { id: 'technology', label: 'Technology', category: NewsCategory.TECHNOLOGY },
  { id: 'ai', label: 'AI & Agents', category: NewsCategory.AI },
  { id: 'competitions', label: 'Competitions', category: NewsCategory.COMPETITIONS },
  { id: 'internships', label: 'Internships & Grants', category: NewsCategory.INTERNSHIPS },
  { id: 'platform_updates', label: "Hacker's Unity", category: NewsCategory.PLATFORM_UPDATES },
];

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    async function loadNews() {
      setLoading(true);
      const activeCat = CATEGORY_TABS.find((t) => t.id === selectedCategory)?.category;
      const res = await fetchPublishedNews(50, 0, activeCat);
      setArticles(res.data);
      setLoading(false);
    }
    loadNews();
  }, [selectedCategory]);

  const filteredArticles = articles.filter((article) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(q) ||
      (article.description && article.description.toLowerCase().includes(q)) ||
      article.category.toLowerCase().includes(q)
    );
  });

  const featuredArticle = filteredArticles[0];
  const gridArticles = filteredArticles.slice(1);

  const handleShare = (e: React.MouseEvent, article: NewsArticle) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/news/${article.slug}`;
      navigator.clipboard.writeText(url);
      setCopiedSlug(article.slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col pb-20">
      {/* Toast for Share */}
      {copiedSlug && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Article link copied to clipboard!</span>
        </div>
      )}

      {/* Hero Header */}
      <section className="relative pt-12 pb-14 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white/70 backdrop-blur-md overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-br from-sky-400/10 via-cyan-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gradient-to-tr from-orange-400/10 via-amber-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-[#0099e6] text-xs font-black uppercase tracking-wider mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#0099e6]" />
            <span>Platform News & Tech Radar</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight sm:leading-tight">
            Latest Hackathon Insights, Tech News &{' '}
            <span className="text-gradient-brand">Ecosystem Updates.</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium">
            Stay ahead with tournament announcements, AI agent breakthroughs, venture grant opportunities, and official platform dispatches.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news by topic, keyword, or hackathon..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0099e6] transition-all"
            />
          </div>
        </div>
      </section>

      {/* Category Navigation Bar */}
      <section className="sticky top-22 z-30 bg-white/95 border-b border-slate-200/80 backdrop-blur-xl py-3 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0099e6] text-white shadow-xs'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 w-full">
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-3 border-[#0099e6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-bold text-slate-500">Loading platform stories...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="py-20 text-center rounded-3xl bg-white border border-slate-200 p-8 shadow-sm max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0099e6] flex items-center justify-center mx-auto mb-3">
              <Newspaper className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">No Articles Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try selecting another category or searching with different keywords.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Featured Article Card (if available) */}
            {featuredArticle && (
              <Link
                href={`/news/${featuredArticle.slug}`}
                className="group block rounded-3xl bg-white border border-slate-200/80 hover:border-[#0099e6]/40 shadow-sm hover:shadow-xl hover:shadow-sky-500/5 transition-all overflow-hidden"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  {/* Featured Cover Image */}
                  <div className="lg:col-span-7 h-64 sm:h-80 lg:h-auto relative bg-slate-900 overflow-hidden">
                    {featuredArticle.coverImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={featuredArticle.coverImage}
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-[#082f49] text-white">
                        <Newspaper className="w-12 h-12 text-sky-400" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider border border-white/20">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        Featured Story
                      </span>
                    </div>
                  </div>

                  {/* Featured Content Info */}
                  <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        {(() => {
                          const badge = getNewsCategoryColor(featuredArticle.category);
                          return (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {getNewsCategoryLabel(featuredArticle.category)}
                            </span>
                          );
                        })()}
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(featuredArticle.publishedAt || featuredArticle.createdAt)}
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-[#0099e6] transition-colors leading-tight">
                        {featuredArticle.title}
                      </h2>

                      <p className="mt-3 text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed font-medium">
                        {featuredArticle.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center font-bold text-xs text-[#0099e6]">
                          {featuredArticle.authorAvatar || '⚡'}
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          {featuredArticle.authorName || "Hacker's Unity"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => handleShare(e, featuredArticle)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Share article"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <span className="inline-flex items-center gap-1 text-xs font-black text-[#0099e6] group-hover:translate-x-0.5 transition-transform">
                          Read Article <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid of Other Articles */}
            {gridArticles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridArticles.map((article) => {
                  const badge = getNewsCategoryColor(article.category);
                  return (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="group rounded-3xl bg-white border border-slate-200/80 hover:border-[#0099e6]/40 shadow-sm hover:shadow-xl hover:shadow-sky-500/5 transition-all overflow-hidden flex flex-col justify-between"
                    >
                      {/* Image Thumbnail */}
                      <div className="h-48 w-full relative bg-slate-900 overflow-hidden shrink-0">
                        {article.coverImage ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={article.coverImage}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-[#082f49] text-white">
                            <Newspaper className="w-8 h-8 text-sky-400" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border backdrop-blur-md ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {getNewsCategoryLabel(article.category)}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-[11px] text-slate-400 font-medium mb-1.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(article.publishedAt || article.createdAt)}
                          </div>

                          <h3 className="text-base font-black text-slate-900 group-hover:text-[#0099e6] transition-colors line-clamp-2 leading-snug">
                            {article.title}
                          </h3>

                          <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                            {article.description}
                          </p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center font-bold text-[11px] text-[#0099e6]">
                              {article.authorAvatar || '⚡'}
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">
                              {article.authorName || "Hacker's Unity"}
                            </span>
                          </div>

                          <span className="text-xs font-black text-[#0099e6] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Read <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
