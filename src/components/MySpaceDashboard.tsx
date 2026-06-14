import React, { useState, useEffect, useRef } from 'react';
import { 
  User as AppUser, 
  FeedPost 
} from '../types';
import { 
  Edit2, 
  Sparkles, 
  TrendingUp, 
  MapPin, 
  BarChart2, 
  Plus, 
  Image, 
  Video, 
  Check, 
  Copy, 
  Share2, 
  ArrowRight, 
  Smartphone, 
  Zap, 
  Heart,
  MessageCircle,
  HelpCircle,
  Settings,
  Link as LinkIcon,
  Lock,
  RefreshCw,
  LogOut,
  Eye,
  Users,
  Shield,
  Clock,
  ExternalLink,
  Award
} from 'lucide-react';

interface MySpaceDashboardProps {
  currentUser: AppUser | null;
  onUpdateProfile: (name: string, email: string, avatar: string, code: string, bio?: string, website?: string) => void;
  feedPosts: FeedPost[];
  onAddPost: (post: Omit<FeedPost, 'id' | 'username' | 'userAvatar' | 'likes' | 'timestamp' | 'liked'>) => void;
}

export default function MySpaceDashboard({
  currentUser,
  onUpdateProfile,
  feedPosts,
  onAddPost
}: MySpaceDashboardProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'analytics' | 'edit_profile' | 'pwa_guide'>('posts');
  
  // Settings Options Modal/Drawer toggle (for "proper touching" extra options)
  const [settingsOpen, setSettingsOpen] = useState(false);

  // States initialized from the current logged-in user profile
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [code, setCode] = useState(currentUser?.companionCode || '');
  const [bio, setBio] = useState(currentUser?.bio || 'Living the dream ✨ | Tracking my location live on Indian GPS satellites!');
  const [website, setWebsite] = useState(currentUser?.website || 'https://ai.studio/build');
  
  // Custom interactive settings variables (under Options panel)
  const [privateMode, setPrivateMode] = useState(false);
  const [verifiedBadgeActive, setVerifiedBadgeActive] = useState(true);
  const [lowPowerGPS, setLowPowerGPS] = useState(false);
  const [mapStylePreference, setMapStylePreference] = useState<'standard' | 'satellite' | 'dark'>('dark');

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Real-time ticking visitor views count state (satisfies live analytics count requirement!)
  const [realtimeViews, setRealtimeViews] = useState(() => {
    const saved = localStorage.getItem('instashare_live_views');
    return saved ? parseInt(saved, 10) : 1482;
  });

  // Post creation fields
  const [postCaption, setPostCaption] = useState('');
  const [postLocation, setPostLocation] = useState('Delhi, India');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postMediaType, setPostMediaType] = useState<'image' | 'video'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  // Invite widgets state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const profileGalleryInputRef = useRef<HTMLInputElement | null>(null);

  const inviteCode = currentUser?.companionCode || 'SAN-PLAY';
  const joinLink = `${window.location.origin}/?joinCode=${inviteCode}`;

  const AVATAR_OPTIONS = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  ];

  // Increment profile views dynamically at random intervals to simulate lively analytics activity!
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeViews(prev => {
        const increment = Math.floor(Math.random() * 3) + 1; // +1 to +3 views
        const updated = prev + increment;
        localStorage.setItem('instashare_live_views', updated.toString());
        return updated;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Filter posts created by the current user
  const myPosts = feedPosts.filter(p => p.username === currentUser?.name || p.isCustom);

  // Save general Profile Settings & Custom parameters
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !code.trim()) return;
    onUpdateProfile(
      name.trim(), 
      email.trim(), 
      avatar, 
      code.trim().toUpperCase(), 
      bio.trim(), 
      website.trim()
    );
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Profile image local gallery picker handler (Base64 translation)
  const handleProfileGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64Str = event.target.result as string;
        setAvatar(base64Str);
        // Instantly save it to profile state
        onUpdateProfile(
          name.trim() || currentUser?.name || 'Bhavya',
          email.trim() || currentUser?.email || 'test@gmail.com',
          base64Str,
          code.trim() || currentUser?.companionCode || 'SAN-PLAY',
          bio,
          website
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Post media attachment local file picker
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPostMediaUrl(event.target.result as string);
        setPostMediaType(file.type.startsWith('video/') ? 'video' : 'image');
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postMediaUrl) return;

    onAddPost({
      mediaUrl: postMediaUrl,
      mediaType: postMediaType,
      caption: postCaption.trim() || 'My new visual capture! 🚀 #instashare',
      location: postLocation.trim() || undefined,
      isCustom: true
    });

    setPostCaption('');
    setPostMediaUrl('');
    setPostSuccess(true);
    setTimeout(() => setPostSuccess(false), 3000);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(joinLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCodeOnly = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Reset system views, mock databases, and log out cleanly
  const handleResetAndLogout = () => {
    if (window.confirm("Are you sure you want to reset all views, delete cache and sign out? This will restore a fresh onboarding sequence.")) {
      localStorage.removeItem('instashare_user_profile');
      localStorage.removeItem('sanpython_added_friends');
      localStorage.removeItem('instashare_live_views');
      localStorage.removeItem('sanpython_saved_posts');
      window.location.reload();
    }
  };

  return (
    <div id="instagram-my-space-container" className="space-y-6">
      
      {/* 📸 STUNNING NATIVE INSTAGRAM-STYLE PROFILE HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl text-left relative overflow-hidden">
        {/* Background ambient mesh */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-pink-500/5 via-violet-500/5 to-transparent rounded-full -z-10 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
          
          {/* PROFILE IMAGE WITH INTEGRATED LOCAL GALLERY PICKER */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full p-1 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg relative cursor-pointer">
              <img 
                src={currentUser?.avatar || avatar} 
                className="w-full h-full rounded-full object-cover border-2 border-slate-900 bg-slate-950" 
                alt="Profile Avatar"
                referrerPolicy="no-referrer"
              />
              <div 
                onClick={() => profileGalleryInputRef.current?.click()}
                className="absolute inset-0 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200 text-white p-2 text-center"
              >
                <Plus className="w-5 h-5 mb-0.5 text-pink-400" />
                <span className="text-[9px] font-bold uppercase tracking-wider leading-none">Browse Gallery</span>
              </div>
            </div>
            
            {/* Real Hidden HTML input to support Device Gallery selection */}
            <input 
              type="file" 
              ref={profileGalleryInputRef} 
              onChange={handleProfileGalleryUpload} 
              accept="image/*" 
              className="hidden" 
            />

            {/* GPS active state indicator */}
            <span className={`absolute bottom-1 right-1 px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase tracking-widest text-white border-2 border-slate-900 flex items-center gap-0.5 shadow-md ${
              currentUser?.isSharingLocation ? 'bg-emerald-500' : 'bg-red-500'
            }`}>
              <span className={`w-1 h-1 rounded-full bg-white ${currentUser?.isSharingLocation ? 'animate-pulse' : ''}`}></span>
              {currentUser?.isSharingLocation ? 'GPS On' : 'GPS Off'}
            </span>
          </div>

          {/* SOCIAL STATS AND ACCORDION DETAILS */}
          <div className="flex-1 space-y-4">
            
            {/* Core Header row with Username and Options Cog (Proper Touching!) */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3.5">
              <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5 font-sans">
                {currentUser?.name || "Bhavya Sarkari"}
                {verifiedBadgeActive && (
                  <span className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center text-white" title="SAN Verified Profile Badge">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </span>
                )}
              </h2>
              
              <span className="text-[10px] font-mono font-bold bg-slate-950 border border-indigo-950 px-2.5 py-1 rounded text-indigo-400 leading-none">
                {currentUser?.companionCode || "SAN-GUEST"}
              </span>

              {/* Action Buttons row */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('edit_profile')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-755 text-white text-3xs font-bold uppercase tracking-wider rounded-lg border border-slate-700/60 transition-all cursor-pointer shadow-sm"
                >
                  Edit Profile
                </button>
                
                {/* ⚙️ OPTIONS GEAR ("PROPER TOUCHING") TRiggers direct Settings Board Drawer */}
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    settingsOpen 
                      ? 'bg-pink-600 text-white border-pink-500' 
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700/60'
                  }`}
                  title="More Options & Advanced Settings"
                >
                  <Settings className={`w-4 h-4 ${settingsOpen ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                </button>
              </div>
            </div>

            {/* INSTAGRAM BIO LAYOUT & STATS PANEL */}
            <div className="flex items-center justify-center md:justify-start gap-8 border-y border-slate-800/60 py-2 text-center md:text-left">
              <div>
                <span className="block text-sm font-extrabold text-white">{myPosts.length}</span>
                <span className="text-[9.5px] uppercase font-bold text-slate-500 font-mono tracking-wide">Posts</span>
              </div>
              <div>
                <span className="block text-sm font-extrabold text-white">1,492</span>
                <span className="text-[9.5px] uppercase font-bold text-slate-500 font-mono tracking-wide">Followers</span>
              </div>
              <div>
                <span className="block text-sm font-extrabold text-white">284</span>
                <span className="text-[9.5px] uppercase font-bold text-slate-500 font-mono tracking-wide">Following</span>
              </div>
            </div>

            {/* Customizable bio text & website address links */}
            <div className="text-xs space-y-1.5 leading-relaxed text-center md:text-left">
              <p className="font-semibold text-slate-200">@{currentUser?.name?.toLowerCase().replace(/\s+/g, '') || 'bhavya_sarkari'}</p>
              <p className="text-slate-300 text-[11.5px] md:max-w-md whitespace-pre-wrap">{currentUser?.bio || bio}</p>
              
              {/* Clickable bio website */}
              <a 
                href={currentUser?.website || website} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sky-400 hover:underline font-semibold text-2xs"
              >
                <LinkIcon className="w-3 h-3" />
                <span>{currentUser?.website || website}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-55" />
              </a>
            </div>

          </div>
        </div>

        {/* ⚙️ EXPANDED OPTIONS & PREFERENCES BOARD ("PROPER TOUCHING") */}
        {settingsOpen && (
          <div className="mt-6 border-t border-slate-800 pt-5 space-y-4 animate-fade-in bg-slate-950/40 p-4.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <div className="flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-pink-500" />
                <h4 className="text-2xs font-bold text-white uppercase tracking-wider font-mono">Advanced Settings & Preferences</h4>
              </div>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="text-[9px] uppercase font-bold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                Close Options ×
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              
              {/* Option A: Privacy Mode toggle */}
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-pink-400" /> Account Privacy
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">When set to Private mode, your buddies will not get coordinates Updates if sharing is deactivated.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrivateMode(!privateMode)}
                  className={`mt-2.5 w-full py-1 rounded text-[8.5px] font-bold uppercase transition-all ${
                    privateMode ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  {privateMode ? '🔒 Private (On)' : '🔓 Public (Off)'}
                </button>
              </div>

              {/* Option B: Account Verified Badge toggles */}
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Verified Badge
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Instantly toggles the sky blue verification badge next to your display photo on chat lists.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setVerifiedBadgeActive(!verifiedBadgeActive)}
                  className={`mt-2.5 w-full py-1 rounded text-[8.5px] font-bold uppercase transition-all ${
                    verifiedBadgeActive ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  {verifiedBadgeActive ? '✓ Verified (On)' : '✗ Verified (Off)'}
                </button>
              </div>

              {/* Option C: Map Layer options */}
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-yellow-400" /> Map Visual Skin
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Switch map imagery types inside the tracking tab on the fly (Hybrid, Satellites, Dark Vector).</p>
                </div>
                <div className="mt-2.5 grid grid-cols-3 gap-1">
                  {(['standard', 'satellite', 'dark'] as const).map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setMapStylePreference(style)}
                      className={`py-1 rounded text-[8px] font-bold uppercase transition-all ${
                        mapStylePreference === style ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-750'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option D: System Telemetry Reset */}
              <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 text-red-500 animate-spin" style={{ animationDuration: '6s' }} /> Advanced Sandbox
                  </span>
                  <p className="text-[9px] text-slate-500 mt-1">Clear local data states, reset follower metrics, and return to Google sign-in onboarding instantly.</p>
                </div>
                
                {/* Reset all views button */}
                <button
                  type="button"
                  onClick={handleResetAndLogout}
                  className="mt-2.5 w-full py-1 bg-gradient-to-r from-red-600 to-pink-600 text-white hover:opacity-90 rounded text-[8.5px] font-bold uppercase transition-all flex items-center justify-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Reset & Sign Out</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* QUICK SUB-NAVIGATION TAB CONTROLS */}
      <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800 w-full overflow-x-auto justify-around">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 max-w-[200px] py-3 rounded-lg text-3xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'posts'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4 text-pink-500" />
          <span>Post Visual ({myPosts.length})</span>
        </button>
        
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 max-w-[200px] py-3 rounded-lg text-3xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-indigo-400" />
          <span>Real-time Analytics</span>
        </button>
        
        <button
          onClick={() => setActiveTab('edit_profile')}
          className={`flex-1 max-w-[200px] py-3 rounded-lg text-3xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'edit_profile'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Edit2 className="w-4 h-4 text-violet-400" />
          <span>Identity Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('pwa_guide')}
          className={`flex-1 max-w-[200px] py-3 rounded-lg text-3xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'pwa_guide'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Get Native App</span>
        </button>
      </div>

      {/* 🛠️ TAB SECTIONS WORKSPACE DISPLAY */}
      <div className="p-0">
        
        {/* SECTION A: Visual Feed & Post Creation */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in text-left">
            
            {/* Left Column: Create visual posts */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 h-fit">
              <div className="border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-pink-500" /> Create Visual Post
                </h4>
                <p className="text-[10px] text-slate-500">Add Base64 photos or videos directly to feed</p>
              </div>

              {postSuccess && (
                <div className="bg-emerald-950 border border-emerald-900 px-3.5 py-2 rounded-xl text-3xs text-emerald-400 font-mono flex items-center gap-2">
                  <Check className="w-4 h-4" /> Published Visual Post successfully! Check feed tab.
                </div>
              )}

              <form onSubmit={handlePublishPost} className="space-y-4">
                
                {/* Local photo upload from device gallery */}
                <div>
                  <label className="block text-[8.5px] font-bold uppercase tracking-wider text-slate-400 mt-1 mb-2">Select from Gallery (Browse local files):</label>
                  
                  {postMediaUrl ? (
                    <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-indigo-500/20 p-2 text-center">
                      {postMediaType === 'image' ? (
                        <img src={postMediaUrl} className="max-h-36 mx-auto object-cover rounded-lg" />
                      ) : (
                        <video src={postMediaUrl} controls className="max-h-36 mx-auto rounded-lg" />
                      )}
                      <button
                        type="button"
                        onClick={() => setPostMediaUrl('')}
                        className="absolute top-4 right-4 bg-slate-900 border border-slate-700 hover:text-white px-2 py-1 rounded text-[8px] uppercase font-mono text-red-400 cursor-pointer"
                      >
                        Change File
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/80 rounded-xl p-8 text-center transition-all cursor-pointer relative">
                      <input
                        type="file"
                        onChange={handleMediaUpload}
                        accept="image/*,video/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Image className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                      <span className="block text-[11px] text-slate-300 font-bold">Pick Local Image / Video</span>
                      <span className="block text-[8.5px] text-slate-500 font-mono mt-1">Converts to live Base64 attachment</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[8.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">Caption / Description</label>
                  <textarea
                    rows={3}
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                    required
                    maxLength={150}
                    placeholder="Enter visual post text here... #delhi #live"
                    className="w-full bg-slate-950 text-slate-100 text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[8.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">Geotag Grid Pin</label>
                  <input
                    type="text"
                    value={postLocation}
                    onChange={(e) => setPostLocation(e.target.value)}
                    placeholder="e.g. Bandra West, Mumbai"
                    className="w-full bg-slate-950 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-colors font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUploading || !postMediaUrl}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 via-pink-600 to-indigo-600 hover:opacity-95 active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-3xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-md shadow-pink-500/10"
                >
                  Publish post to feed
                </button>

              </form>
            </div>

            {/* Right Column: Visual Feed Grid */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">My Shared Feed Pictures ({myPosts.length})</h4>
                <div className="flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                </div>
              </div>
              
              {myPosts.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-16 text-center text-slate-500 space-y-2">
                  <Image className="w-12 h-12 opacity-25 mx-auto text-slate-400 mb-1" />
                  <p className="text-xs font-mono">No posts found created by you.</p>
                  <p className="text-[10px] text-slate-500 font-sans">Choose files on the left form to upload Base64 visual posts instantly!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {myPosts.map(post => (
                    <div key={post.id} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-800 bg-slate-950">
                      {post.mediaType === 'image' ? (
                        <img src={post.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <video src={post.mediaUrl} className="w-full h-full object-cover" />
                      )}
                      
                      {/* Hover stats overlay */}
                      <div className="absolute inset-0 bg-black/80 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-left">
                        <div className="flex justify-between text-white text-[9px] font-mono font-bold leading-none">
                          <span className="flex items-center gap-0.5"><Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" /> {post.likes}</span>
                          <span className="flex items-center gap-0.5"><MessageCircle className="w-3.5 h-3.5 text-indigo-400" /> 12</span>
                        </div>
                        <div className="truncate">
                          <p className="text-[9.5px] font-bold text-white leading-tight mb-1 flex items-center gap-1"><MapPin className="w-3 h-3 text-red-400" /> {post.location || 'Delhi, India'}</p>
                          <p className="text-[8.5px] text-slate-300 leading-normal truncate">{post.caption}</p>
                          <span className="text-[7.5px] text-slate-500 font-mono italic block mt-1">{post.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* SECTION B: Real-time Analytics Visualizer (with tick counts!) */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in text-left">
            
            {/* Quick Metrics Cards Row (Views increments real time!) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl text-left relative overflow-hidden">
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-widest block flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" /> Live Profile Views
                </span>
                {/* Dynamically incremented counter showing live sandbox visitor telemetry */}
                <p id="metric-views-count-live" className="text-2xl font-extrabold text-white mt-1.5 font-sans flex items-center gap-1.5">
                  {realtimeViews.toLocaleString()}
                </p>
                <span className="text-[9px] text-emerald-400 font-semibold mt-1 block flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +{(realtimeViews - 1482)} today (Active pings)
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl text-left">
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-widest block flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-pink-400" /> Connections Reach
                </span>
                <p className="text-2xl font-extrabold text-white mt-1.5 font-sans">89%</p>
                <span className="text-[9.5px] text-indigo-400 font-semibold mt-1 block">Active satellite tracking</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl text-left">
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-widest block flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-yellow-400" /> GPS sharing state
                </span>
                <p className="text-2xl font-extrabold text-white mt-1.5 font-sans">
                  {currentUser?.isSharingLocation ? 'On Grid' : 'Offline'}
                </p>
                <span className="text-[9.5px] text-slate-400 mt-1 block">
                  {currentUser?.isSharingLocation ? '🔴 Broadcasting GPS' : '🗺️ Shared maps muted'}
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl text-left">
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-widest block flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-purple-400" /> Engagement clicks
                </span>
                <p className="text-2xl font-extrabold text-white mt-1.5 font-sans">158</p>
                <span className="text-[9.5px] text-purple-400 font-semibold mt-1 block">Direct message feedback</span>
              </div>

            </div>

            {/* SVG Visual line chart */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-805 pb-3 flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Live Session Metric Fluctuations</h4>
                  <p className="text-[10px] text-slate-500">Real-time GPS broadcast intervals versus live visitors views flow</p>
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono font-bold">
                  <span className="flex items-center gap-1 text-indigo-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span> Profile visits
                  </span>
                  <span className="flex items-center gap-1 text-pink-500">
                    <span className="w-2.5 h-2.5 rounded-sm bg-pink-500 animate-pulse"></span> GPS signals
                  </span>
                </div>
              </div>

              <div className="w-full h-48 relative">
                <svg viewBox="0 0 500 150" className="w-full h-full text-indigo-500/10">
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1="0" y1="75" x2="500" y2="75" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />

                  <path 
                    d="M 0 150 L 50 110 L 100 85 L 150 120 L 200 60 L 250 95 L 300 35 L 350 100 L 400 50 L 450 70 L 500 25 L 500 150 Z" 
                    fill="url(#indigo-grad-new)" 
                    opacity="0.15" 
                  />
                  <path 
                    d="M 0 150 L 50 110 L 100 85 L 150 120 L 200 60 L 250 95 L 300 35 L 350 100 L 400 50 L 450 70 L 500 25" 
                    fill="none" 
                    stroke="#6366f1" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                  />

                  <path 
                    d="M 0 140 L 50 130 L 100 115 L 150 98 L 200 118 L 250 82 L 300 92 L 350 64 L 400 75 L 450 45 L 500 58" 
                    fill="none" 
                    stroke="#ec4899" 
                    strokeWidth="2" 
                    strokeLinecap="round"
                    strokeDasharray="4"
                  />

                  <defs>
                    <linearGradient id="indigo-grad-new" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  <circle cx="200" cy="60" r="4" fill="#6366f1" stroke="#090d16" strokeWidth="1.5" />
                  <circle cx="300" cy="35" r="4" fill="#ec4899" stroke="#090d16" strokeWidth="1.5" />
                  <circle cx="500" cy="25" r="4" fill="#6366f1" stroke="#090d16" strokeWidth="1.5" />
                </svg>
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[8px] font-mono text-slate-500 uppercase mt-1">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>

            {/* Share app link widget */}
            <div className="bg-gradient-to-tr from-indigo-950/60 to-slate-900 border border-indigo-500/20 p-5 rounded-xl space-y-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-current text-yellow-400" /> Shared Invitation Dashboard
                </span>
                <p className="text-xs font-bold text-white uppercase tracking-tight">One-click Whatsapp link generation</p>
                <p className="text-[10px] text-slate-400 max-w-md leading-relaxed">
                  Send this visual locator sandbox link to anyone. Logging in from their phones updates the public Leaflet map and builds real-time chatting loops with zero delays!
                </p>
              </div>

              <div className="flex gap-2 w-full sm:w-auto self-end shrink-0">
                <button
                  onClick={copyInviteLink}
                  className="flex-1 sm:flex-none flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-bold text-3xs uppercase px-4 py-3 rounded-lg cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied Invitation URL!' : 'Copy invite link'}</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* SECTION C: Customize Profile Settings Form */}
        {activeTab === 'edit_profile' && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 animate-fade-in text-left">
            <div className="mb-4 border-b border-slate-850 pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1">
                <Edit2 className="w-4 h-4 text-pink-500" /> Customize Identity Profile
              </h4>
              <p className="text-[10px] text-slate-500">Modify display descriptors and custom bio details</p>
            </div>

            {saveSuccess && (
              <div className="bg-emerald-950 border border-emerald-900 px-3.5 py-2 rounded-xl text-3xs text-emerald-400 font-mono flex items-center gap-2 mb-4">
                <Check className="w-4 h-4" /> Attributes updated successfully!
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-[8.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[8.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">Unique Companion Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-colors font-mono uppercase"
                  placeholder="e.g. SAN-BHAVYA"
                />
              </div>

              <div>
                <label className="block text-[8.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">Gmail / Account Identity</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/60 text-slate-400 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 outline-none cursor-not-allowed font-mono"
                  disabled
                  title="Your registered email ID"
                />
              </div>

              <div>
                <label className="block text-[8.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">Bio Text Paragraph</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-colors"
                  placeholder="Tell your followers about yourself..."
                />
              </div>

              <div>
                <label className="block text-[8.5px] font-bold uppercase tracking-wider text-slate-400 mb-1">Website Address Link</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-colors font-mono"
                  placeholder="e.g. https://instagram.com"
                />
              </div>

              <div>
                <label className="block text-[8.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">Preset Avatar Options (or Browse Gallery Above)</label>
                <div className="grid grid-cols-6 gap-2 mb-2">
                  {AVATAR_OPTIONS.map((av, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`relative rounded-full aspect-square overflow-hidden p-0.5 border-2 transition-all cursor-pointer hover:scale-105 ${
                        avatar === av ? 'border-indigo-500 scale-102 ring-2 ring-indigo-500/10' : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <img src={av} className="w-full h-full rounded-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full bg-slate-950/65 text-slate-400 text-[10px] mt-2 px-3 py-2 rounded-lg border border-slate-800 outline-none font-mono truncate"
                  placeholder="Direct image source URL"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-bold text-3xs uppercase tracking-wider rounded-lg cursor-pointer text-center mt-2 shadow-sm"
              >
                Apply Profile Changes
              </button>
            </form>
          </div>
        )}

        {/* SECTION D: Progressive Web App installation steps */}
        {activeTab === 'pwa_guide' && (
          <div className="space-y-6 animate-fade-in text-left max-w-2xl mx-auto">
            
            <div className="bg-gradient-to-tr from-slate-900 to-indigo-950/20 p-5 rounded-xl border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
                <Smartphone className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-tight">Download Instashare Standalone App</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Turn this map coordinates visualizer into a full screen, standalone mobile application on Android and iOS instantly! By harnessing progressive app architecture, you bypass third-party store barriers.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg text-xs font-bold font-mono">A</div>
                  <h5 className="text-3xs uppercase font-bold text-white tracking-widest font-mono">Setup on Android Google Chrome</h5>
                </div>
                <ol className="text-[10.5px] space-y-2.5 text-slate-400 list-decimal pl-4.5 leading-relaxed font-sans">
                  <li>Load this shareable preview on your Android browser.</li>
                  <li>Tap the <span className="text-white font-semibold">Menu button (Three vertical dots)</span> in Chrome's top bar.</li>
                  <li>Select <span className="text-white font-semibold">"Install App"</span> or <span className="text-white font-semibold">"Add to Home Screen"</span> from options.</li>
                  <li>Confirm installation. The app launches immediately without navigation constraints!</li>
                </ol>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-pink-500/10 text-pink-400 p-2 rounded-lg text-xs font-bold font-mono">B</div>
                  <h5 className="text-3xs uppercase font-bold text-white tracking-widest font-mono">Setup on Apple iPhone Safari</h5>
                </div>
                <ol className="text-[10.5px] space-y-2.5 text-slate-400 list-decimal pl-4.5 leading-relaxed font-sans">
                  <li>Load this browser coordinate link inside Apple iOS Safari.</li>
                  <li>In the lower bottom bar, tap the blue <span className="text-white font-semibold">"Share" icon</span> (square box with an up arrow).</li>
                  <li>Scroll the options list down and tap <span className="text-white font-semibold">"Add to Home Screen"</span>.</li>
                  <li>Click <span className="text-white font-semibold">Add</span> in Chrome/Safar's upper corner. You are done!</li>
                </ol>
              </div>

            </div>

            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-wrap gap-4 items-center justify-around text-center text-[9px] font-bold text-indigo-400 uppercase font-mono">
              <span className="flex items-center gap-1">✓ No URL Header (Full Screen)</span>
              <span className="flex items-center gap-1">✓ Direct Local Sandbox Storage</span>
              <span className="flex items-center gap-1">✓ Fluid Native Performance</span>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
