'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  PlusCircle,
  Trophy,
  Bell,
  Menu,
  X,
  Compass,
  LogOut,
  User,
} from 'lucide-react';
import { Logo } from './logo';
import { SearchDialog } from './search-dialog';
import { AuthModal } from './auth-modal';
import { useAuth } from '@/lib/auth-context';

export function Navbar() {
  const pathname = usePathname();
  const { user: currentUser, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { name: 'Hackathons', href: '/hackathons', icon: Trophy },
    { name: 'My Dashboard', href: '/dashboard', icon: Compass },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-slate-200/80 backdrop-blur-xl shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-22 flex items-center justify-between gap-6">
          {/* Left: Brand Logo */}
          <div className="flex items-center shrink-0 pl-3 sm:pl-6 lg:pl-8">
            <Link href="/" className="flex items-center group py-1">
              <Logo size={74} showText={false} />
            </Link>
          </div>

          {/* Center-Right: Desktop Nav Links */}
          <nav className="hidden md:flex items-center justify-center gap-2 lg:gap-4 flex-1 ml-4 lg:ml-8">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] sm:text-sm font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#0099e6]/10 text-[#0099e6] border border-[#0099e6]/25 shadow-2xs'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/90'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Action Bar */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Quick Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs text-slate-500 hover:text-slate-900 transition-all cursor-pointer whitespace-nowrap"
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
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#f97316]/10 to-[#ea580c]/10 hover:from-[#f97316]/20 hover:to-[#ea580c]/20 text-[#ea580c] border border-[#f97316]/30 text-xs font-bold transition-all whitespace-nowrap shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Host Event</span>
            </Link>

            {/* Notifications Menu Trigger */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f97316]" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 animate-in fade-in zoom-in-95">
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

            {/* User Profile / Supabase Login */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2.5 pr-3 rounded-xl bg-sky-50 border border-[#0099e6]/30 hover:border-[#0099e6] transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#0099e6] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-slate-800 max-w-[90px] truncate hidden sm:inline">
                    {currentUser.name.split(' ')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 p-2 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 animate-in fade-in zoom-in-95">
                    <div className="p-2.5 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
                    </div>
                    <div className="py-1 space-y-1 text-xs font-medium">
                      <Link
                        href="/settings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-[#0099e6]" />
                        <span>Account & Settings</span>
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#0099e6]" />
                        <span>My Dashboard & Analytics</span>
                      </Link>
                      <Link
                        href="/host"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-[#ea580c]" />
                        <span>Organizer Studio</span>
                      </Link>
                    </div>
                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          signOut();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs transition-all shadow-sm shadow-sky-500/20 cursor-pointer whitespace-nowrap"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
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
