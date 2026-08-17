import Link from 'next/link';
import { Github, Twitter, Disc as Discord, ShieldCheck, Heart } from 'lucide-react';
import { Logo } from './logo';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <Logo size={52} showText={false} />
            </Link>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              The premier global arena for hackers, founders, and community builders. Discover hackathons, find your dream squad, and ship venture-grade software.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#0099e6] hover:border-[#0099e6]/40 transition-all"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#0099e6] hover:border-[#0099e6]/40 transition-all"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#f97316] hover:border-[#f97316]/40 transition-all"
              >
                <Discord className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Explore</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/hackathons" className="hover:text-[#0099e6] transition-colors">
                  All Hackathons
                </Link>
              </li>
              <li>
                <Link href="/teammates" className="hover:text-[#0099e6] transition-colors">
                  Find Teammates
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-[#0099e6] transition-colors">
                  Global Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/host" className="hover:text-[#0099e6] transition-colors">
                  Host an Event
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Domains</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/hackathons?category=HACKATHON" className="hover:text-[#0099e6] transition-colors">
                  GenAI & LLMs
                </Link>
              </li>
              <li>
                <Link href="/hackathons?category=HACKATHON" className="hover:text-[#0099e6] transition-colors">
                  Web3 & Zero-Knowledge
                </Link>
              </li>
              <li>
                <Link href="/hackathons?category=COMPETITION" className="hover:text-[#0099e6] transition-colors">
                  Cybersecurity DEFCON
                </Link>
              </li>
              <li>
                <Link href="/hackathons?category=HACKATHON" className="hover:text-[#0099e6] transition-colors">
                  Robotics & Edge AI
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Hackers Dispatch</h4>
            <p className="text-[11px] text-slate-500">
              Get notified of $10k+ hackathons and verified funding grants every Monday.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="dev@domain.com"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#0099e6]"
              />
              <button className="px-3 py-1.5 bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 Hacker&apos;s Unity Platform. Built for developers worldwide.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>SOC2 & KYC Verified Payouts</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-[#f97316] fill-[#f97316]" />
              <span>for Builders</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
