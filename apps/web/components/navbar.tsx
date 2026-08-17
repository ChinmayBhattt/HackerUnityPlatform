'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  PlusCircle,
  Trophy,
  Users,
  BarChart3,
  Bell,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { Logo } from './logo';
import { SearchDialog } from './search-dialog';
import { AuthModal } from './auth-modal';
import { getStoredUser } from '@/lib/storage';
import { UserPublic, UserRole } from '@hackers-unity/shared-types';

export function Navbar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserPublic | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
    const handleStorage = () => setCurrentUser(getStoredUser());
    window.addEventListener('hackers_unity_storage_change', handleStorage);
    return () => window.removeEventListener('hackers_unity_storage_change', handleStorage);
  }, []);

  const navLinks = [
    { name: 'Hackathons', href: '/hackathons', icon: Trophy },
    { name: 'Find Teammates', href: '/teammates', icon: Users },
    { name: 'Leaderboard', href: '/leaderboard', icon: BarChart3 },
    { name: 'My Dashboard', href: '/dashboard', icon: Compass },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/90 border-b border-slate-200/80 backdrop-blur-xl shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center group">
              <Logo size={34} showText={true} />
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#0099e6]/10 text-[#0099e6] border border-[#0099e6]/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5">
            {/* Quick Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#0099e6]" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Host Hackathon Button */}
            <Link
              href="/host"
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#f97316]/10 to-[#ea580c]/10 hover:from-[#f97316]/20 hover:to-[#ea580c]/20 text-[#ea580c] border border-[#f97316]/30 text-xs font-bold transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Host Event</span>
            </Link>

            {/* Notifications Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#f97316]" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 p-3 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <span className="text-[10px] text-[#0099e6] font-semibold cursor-pointer">Mark all read</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-sky-50/80 border border-sky-100 text-slate-700">
                      <div className="font-bold text-slate-900">AI Nexus Hackathon Reminder</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Registration closes in 14 days. Ensure your team is set!</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-orange-50/80 border border-orange-100 text-slate-700">
                      <div className="font-bold text-slate-900">Team Invite from Vikramaditya</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Invited you to join &quot;ZK-Shield Primitives&quot;.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Login */}
            {currentUser ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-xl bg-sky-50 border border-[#0099e6]/30 hover:border-[#0099e6] transition-colors"
              >
                <div className="w-6 h-6 rounded-lg bg-[#0099e6] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="text-xs font-bold text-slate-800 max-w-[90px] truncate hidden sm:inline">
                  {currentUser.name.split(' ')[0]}
                </span>
              </Link>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-4 py-1.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs transition-all shadow-sm shadow-sky-500/20 cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold ${
                  pathname === item.href ? 'bg-sky-50 text-[#0099e6]' : 'text-slate-600'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
            <Link
              href="/host"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-[#ea580c] bg-orange-50 border border-orange-200"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Host a Hackathon</span>
            </Link>
          </div>
        )}
      </header>

      {/* Global Modals */}
      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
