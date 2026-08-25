'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  CheckCircle2,
  Sparkles,
  Newspaper,
  BookOpen,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { NewsArticle } from '@hackers-unity/shared-types';
import { fetchNewsBySlug, fetchPublishedNews, getNewsCategoryLabel, getNewsCategoryColor } from '@/lib/news-service';
import { formatDate } from '@/lib/utils';

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [relatedNews, setRelatedNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadArticle() {
      if (!slug) return;
      setLoading(true);
      const res = await fetchNewsBySlug(slug);
      if (res.data) {
        setArticle(res.data);
        // Load related articles
        const relatedRes = await fetchPublishedNews(4, 0, res.data.category);
        setRelatedNews(relatedRes.data.filter((a) => a.slug !== slug).slice(0, 3));
      }
      setLoading(false);
    }
    loadArticle();
  }, [slug]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareTwitter = () => {
    if (!article || typeof window === 'undefined') return;
    const text = encodeURIComponent(`Check out "${article.title}" on Hacker's Unity!\n\n${window.location.href}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    if (typeof window === 'undefined') return;
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  if (loading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center py-32">
        <div className="w-10 h-10 border-3 border-[#0099e6] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-500">Loading story...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center py-32 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-sky-50 text-[#0099e6] flex items-center justify-center mb-4 border border-sky-100">
          <Newspaper className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Article Not Found</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm">
          The story you are looking for may have been moved or is currently unavailable.
        </p>
        <Link
          href="/news"
          className="mt-6 px-6 py-2.5 rounded-2xl bg-[#0099e6] text-white text-xs font-extrabold shadow-sm hover:bg-[#0284c7] transition-all"
        >
          Back to All News
        </Link>
      </div>
    );
  }

  const categoryBadge = getNewsCategoryColor(article.category);

  return (
    <div className="w-full flex-1 flex flex-col pb-24">
      {/* Toast */}
      {copied && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-slate-950 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Article link copied to clipboard!</span>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 w-full pt-8 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Link href="/news" className="hover:text-[#0099e6] transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Updates</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-400 capitalize truncate max-w-[200px]">
            {getNewsCategoryLabel(article.category)}
          </span>
        </div>
      </div>

      {/* Main Article Container */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 w-full space-y-8">
        {/* Article Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`px-3 py-1 rounded-xl text-[11px] font-extrabold uppercase tracking-wide border ${categoryBadge.bg} ${categoryBadge.text} ${categoryBadge.border}`}
            >
              {getNewsCategoryLabel(article.category)}
            </span>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(article.publishedAt || article.createdAt)}
            </span>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              3 min read
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight sm:leading-tight">
            {article.title}
          </h1>

          {article.description && (
            <p className="text-sm sm:text-lg text-slate-600 font-medium leading-relaxed">
              {article.description}
            </p>
          )}

          {/* Author info & share bar */}
          <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center font-black text-sm text-[#0099e6] shadow-xs">
                {article.authorAvatar || '⚡'}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                  {article.authorName || "Hacker's Unity Editorial"}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Official Dispatch</div>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy Link"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy</span>
              </button>
              <button
                onClick={handleShareTwitter}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                X / Twitter
              </button>
              <button
                onClick={handleShareLinkedIn}
                className="px-3 py-1.5 rounded-xl bg-[#0077b5] hover:bg-[#006097] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                LinkedIn
              </button>
            </div>
          </div>
        </header>

        {/* Cover Banner Image */}
        {article.coverImage && (
          <div className="w-full h-72 sm:h-96 rounded-3xl overflow-hidden bg-slate-900 relative shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Body Content */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm text-slate-800 leading-relaxed text-sm sm:text-base font-normal space-y-6">
          {article.content ? (
            <div className="prose prose-slate max-w-none space-y-4">
              {article.content.split('\n\n').map((block, idx) => {
                // Header level 2
                if (block.startsWith('## ')) {
                  return (
                    <h2
                      key={idx}
                      className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-4 first:pt-0"
                    >
                      {block.replace('## ', '')}
                    </h2>
                  );
                }
                // Header level 3
                if (block.startsWith('### ')) {
                  return (
                    <h3
                      key={idx}
                      className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight pt-2"
                    >
                      {block.replace('### ', '')}
                    </h3>
                  );
                }
                // Bullet points
                if (block.includes('\n- ') || block.startsWith('- ')) {
                  const items = block.split('\n- ').map((item) => item.replace(/^- /, ''));
                  return (
                    <ul key={idx} className="space-y-2 list-none pl-0 my-4">
                      {items.map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-2 text-slate-700 text-xs sm:text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0099e6] mt-2 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }
                // Numbered list
                if (block.match(/^\d+\.\s/)) {
                  const items = block.split(/\n(?=\d+\.\s)/);
                  return (
                    <ol key={idx} className="space-y-2 list-decimal pl-5 my-4 text-xs sm:text-sm text-slate-700">
                      {items.map((item, iIdx) => (
                        <li key={iIdx} className="pl-1">
                          {item.replace(/^\d+\.\s/, '')}
                        </li>
                      ))}
                    </ol>
                  );
                }
                // Regular Paragraph
                return (
                  <p key={idx} className="text-slate-700 text-xs sm:text-sm sm:leading-relaxed font-normal">
                    {block}
                  </p>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 italic">No additional content provided for this dispatch.</p>
          )}
        </div>

        {/* CTA Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-sky-50 via-white to-orange-50/70 border border-sky-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-[#0099e6] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ready to Build?</span>
            </div>
            <h4 className="text-lg font-black text-slate-900">Explore Live Hackathons & Form Squads</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Put these insights to work on active competitive tracks with real venture prizes.
            </p>
          </div>
          <Link
            href="/hackathons"
            className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-black transition-all shadow-md shadow-sky-500/20 whitespace-nowrap text-center cursor-pointer"
          >
            Browse Hackathons
          </Link>
        </div>

        {/* Related News Section */}
        {relatedNews.length > 0 && (
          <div className="pt-8 border-t border-slate-200 space-y-6">
            <h3 className="text-xl font-black text-slate-900">Related Dispatches</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedNews.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/news/${rel.slug}`}
                  className="group p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#0099e6]/40 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold mb-1">
                      {formatDate(rel.publishedAt || rel.createdAt)}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#0099e6] line-clamp-2 transition-colors">
                      {rel.title}
                    </h4>
                  </div>
                  <div className="mt-3 text-[11px] font-black text-[#0099e6] flex items-center gap-1">
                    <span>Read</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
