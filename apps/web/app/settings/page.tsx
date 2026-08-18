'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User as UserIcon,
  Shield,
  KeyRound,
  Mail,
  Phone,
  GraduationCap,
  Building,
  Github,
  Linkedin,
  Globe,
  Plus,
  X as XIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Bell,
  Sliders,
  ExternalLink,
  Sparkles,
  Lock,
  Compass,
  ArrowLeft,
  Smartphone,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { AvatarUpload } from '@/components/avatar-upload';
import { AuthModal } from '@/components/auth-modal';

export default function SettingsPage() {
  const { user, updateUserProfile, updateUserPassword, signOut, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  // Settings Tabs
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'socials' | 'notifications' | 'danger'>('profile');

  // Profile Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [college, setCollege] = useState('');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);

  // Social Links
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');

  // Password / Security States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Notification Preferences
  const [notifyHackathons, setNotifyHackathons] = useState(true);
  const [notifyInvites, setNotifyInvites] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);

  // Status & Feedback
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setCollege(user.college || user.organization || '');
      setGraduationYear(user.graduationYear ? String(user.graduationYear) : '2026');
      setSkills(user.skills && user.skills.length > 0 ? user.skills : ['Next.js 16', 'TypeScript', 'PostgreSQL']);
      setAvatar(user.avatarUrl || null);
      setGithub(user.socialLinks?.github || '');
      setLinkedin(user.socialLinks?.linkedin || '');
      setPortfolio(user.socialLinks?.portfolio || '');
    }
  }, [user]);

  const handleAddSkill = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);

    const res = await updateUserProfile({
      name: name.trim() || undefined,
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
      college: college.trim() || undefined,
      organization: college.trim() || undefined,
      graduationYear: Number(graduationYear) || 2026,
      skills: skills,
      avatarUrl: avatar || undefined,
      socialLinks: {
        github: github.trim(),
        linkedin: linkedin.trim(),
        portfolio: portfolio.trim(),
      },
    });

    setIsSavingProfile(false);
    if (res.error) {
      setProfileError(res.error);
    } else {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    const res = await updateUserPassword(newPassword);
    setIsUpdatingPassword(false);

    if (res.error) {
      setPasswordMsg({ type: 'error', text: res.error });
    } else {
      setPasswordMsg({ type: 'success', text: 'Password successfully updated in your account!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 3000);
    }
  };

  // If user is not logged in
  if (!loading && !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0099e6] mb-6 shadow-sm">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account & Settings</h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          Sign in or create an account to manage your profile, security settings, social handles, and preferences.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={() => setAuthOpen(true)}
            className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            Sign In / Register
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Back to Home
          </Link>
        </div>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Toast Notification */}
      {profileSaved && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Account changes saved successfully!</span>
        </div>
      )}

      {/* Header & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#0099e6] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Account & Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Manage your personal profile, credentials, public socials, avatar, and security preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Compass className="w-4 h-4 text-[#0099e6]" />
            <span>Go to Analytics Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar Navigation (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
            {/* User Mini Profile Badge */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-sky-50/70 border border-sky-100 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0099e6] text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0 overflow-hidden">
                {avatar && avatar.startsWith('http') ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span>{name.charAt(0) || 'H'}</span>
                )}
              </div>
              <div className="overflow-hidden">
                <div className="font-extrabold text-sm text-slate-900 truncate">{name || 'Hacker'}</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">{email}</div>
              </div>
            </div>

            {/* Nav Tabs */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${
                activeTab === 'profile'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Profile Information</div>
                <div className={`text-[10px] font-normal ${activeTab === 'profile' ? 'text-white/80' : 'text-slate-400'}`}>
                  Avatar, bio, college & skills
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('socials')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${
                activeTab === 'socials'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Socials & Portfolio</div>
                <div className={`text-[10px] font-normal ${activeTab === 'socials' ? 'text-white/80' : 'text-slate-400'}`}>
                  GitHub, LinkedIn, Website
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${
                activeTab === 'security'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Security & Password</div>
                <div className={`text-[10px] font-normal ${activeTab === 'security' ? 'text-white/80' : 'text-slate-400'}`}>
                  Password & 2FA credentials
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${
                activeTab === 'notifications'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Notification Alerts</div>
                <div className={`text-[10px] font-normal ${activeTab === 'notifications' ? 'text-white/80' : 'text-slate-400'}`}>
                  Email & team invite updates
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('danger')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${
                activeTab === 'danger'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Account Management</div>
                <div className={`text-[10px] font-normal ${activeTab === 'danger' ? 'text-white/80' : 'text-rose-400'}`}>
                  Sign out & account actions
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Right Content Area (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Tab: Profile Information */}
          {activeTab === 'profile' && (
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#0099e6]" />
                  <span>Public Profile Information</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  This info is displayed to organizers and teammates when you register or form squads.
                </p>
              </div>

              {profileError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Avatar Uploader */}
                <div>
                  <AvatarUpload
                    currentAvatar={avatar}
                    onAvatarChange={(newUrl) => setAvatar(newUrl)}
                    onAvatarRemove={() => setAvatar(null)}
                  />
                </div>

                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="e.g. Chinmay Bhatt"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                      />
                    </div>
                  </div>
                </div>

                {/* Email (Readonly) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Primary login email address cannot be modified directly.</span>
                </div>

                {/* Bio / Summary */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Short Bio & Specialties</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell hackathon organizers and squads what you love building..."
                    className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6] leading-relaxed"
                  />
                </div>

                {/* College & Grad Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">College / Organization</label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder="e.g. IIT Delhi / Developer Guild"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Graduation Year</label>
                    <select
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                    >
                      <option value="2024">2024 or earlier</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                      <option value="2028">2028+</option>
                    </select>
                  </div>
                </div>

                {/* Skills Tag Management */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Skills & Tech Stacks</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-[#0099e6] border border-sky-200 text-xs font-bold"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      placeholder="Add a skill (e.g. Next.js, Rust, Docker) and press Enter"
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. Tab: Socials & Portfolio */}
          {activeTab === 'socials' && (
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#0099e6]" />
                  <span>Social Handles & Proof of Work</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Connect your GitHub repositories, LinkedIn, and personal portfolio links.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">GitHub Profile URL</label>
                  <div className="relative">
                    <Github className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/your-username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">LinkedIn Profile URL</label>
                  <div className="relative">
                    <Linkedin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/your-profile"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Personal Portfolio or Website</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="https://yourportfolio.dev"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Save Social Links</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. Tab: Security & Password */}
          {activeTab === 'security' && (
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span>Security & Credentials</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Update your authentication credentials and manage session security.
                </p>
              </div>

              {passwordMsg && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                    passwordMsg.type === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}
                >
                  {passwordMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter your new password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Authenticated with Supabase Auth</span>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isUpdatingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>

              {/* Two-Factor Info */}
              <div className="pt-6 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#0099e6] flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Phone Authentication & SMS OTP</div>
                      <div className="text-[11px] text-slate-500">Log in securely with one-time SMS codes.</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Tab: Notification Alerts */}
          {activeTab === 'notifications' && (
            <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#ea580c]" />
                  <span>Notification Preferences</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Control the communications and alerts you receive from Hacker’s Unity.
                </p>
              </div>

              <div className="space-y-4">
                <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">Hackathon Deadlines & Milestones</div>
                    <div className="text-[11px] text-slate-500">Get reminders before registration and submission deadlines end.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyHackathons}
                    onChange={(e) => setNotifyHackathons(e.target.checked)}
                    className="w-4 h-4 text-[#0099e6] rounded border-slate-300 focus:ring-[#0099e6]"
                  />
                </label>

                <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">Team Invites & Squad Requests</div>
                    <div className="text-[11px] text-slate-500">Receive alerts when builders invite you to form hackathon squads.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyInvites}
                    onChange={(e) => setNotifyInvites(e.target.checked)}
                    className="w-4 h-4 text-[#0099e6] rounded border-slate-300 focus:ring-[#0099e6]"
                  />
                </label>

                <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">Weekly Builder Digest</div>
                    <div className="text-[11px] text-slate-500">A weekly summary of top upcoming hackathons, prizes, and leaderboards.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyDigest}
                    onChange={(e) => setNotifyDigest(e.target.checked)}
                    className="w-4 h-4 text-[#0099e6] rounded border-slate-300 focus:ring-[#0099e6]"
                  />
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setProfileSaved(true);
                    setTimeout(() => setProfileSaved(false), 3000);
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                >
                  Save Notification Preferences
                </button>
              </div>
            </div>
          )}

          {/* 5. Tab: Danger / Account Management */}
          {activeTab === 'danger' && (
            <div className="p-7 rounded-3xl bg-white border border-rose-200 shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-rose-100 pb-4">
                <h2 className="text-xl font-black text-rose-600 tracking-tight flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                  <span>Account Session & Actions</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage active login session or sign out of your account on this device.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-3">
                <div className="text-xs font-bold text-rose-900">Sign Out of Hacker&apos;s Unity</div>
                <p className="text-[11px] text-rose-700">
                  This will securely end your current Supabase authenticated session on this browser.
                </p>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
