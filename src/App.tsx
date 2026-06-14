import React, { useState, useEffect, useRef } from 'react';
import {
  Instagram,
  Send,
  Image,
  Video,
  Phone,
  Video as VideoIcon,
  MapPin,
  Map,
  User,
  Users,
  Settings,
  Bell,
  CheckCircle,
  LogOut,
  Navigation,
  Sparkles,
  Compass,
  AlertCircle,
  HelpCircle,
  Tv,
  Camera,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  X,
  UserPlus,
  Edit2,
  Copy,
  Check
} from 'lucide-react';
import { User as AppUser, Message, CallState, Location as UserLocation, UserStory } from './types';
import ChatMessenger from './components/ChatMessenger';
import GoogleMapsViewer from './components/GoogleMapsViewer';
import CallingOverlay from './components/CallingOverlay';
import MySpaceDashboard from './components/MySpaceDashboard';
import StoryViewerOverlay from './components/StoryViewerOverlay';

// Setup Mock Instagram Feed Posts to reflect brand aesthetic
interface FeedPost {
  id: string;
  username: string;
  userAvatar: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  likes: number;
  caption: string;
  location?: string;
  timestamp: string;
  liked?: boolean;
  isCustom?: boolean;
}

const INITIAL_FEED_POSTS: FeedPost[] = [
  {
    id: 'post_1',
    username: 'alex.rivera',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    likes: 342,
    caption: 'Loving the beautiful sunset at the Bay Area today! 🌅 Let me know if you are around, live location is sharing!',
    location: 'San Francisco, CA',
    timestamp: '2 hours ago'
  },
  {
    id: 'post_2',
    username: 'sophia.chen',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    mediaUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format&fit=crop&q=80',
    mediaType: 'image',
    likes: 512,
    caption: 'Chasing fall foliage in upstate New York 🍁 nature is turning gold.',
    location: 'Catskill Mountains',
    timestamp: '5 hours ago'
  }
];

export default function App() {
  // Authentication & Profile State (Fast customized onboarding + local profile caching)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [activeUsers, setActiveUsers] = useState<AppUser[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(true);

  // New states for companion adding and stories
  const [addedFriendIds, setAddedFriendIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sanpython_added_friends');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [invitedCode, setInvitedCode] = useState<string>('');
  const [stories, setStories] = useState<UserStory[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isCreatingStory, setIsCreatingStory] = useState(false);

  // On startup, look for invite parameters from WhatsApp
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('joinCode');
      if (code) {
        setInvitedCode(code.trim().toUpperCase());
        setOnboardName("Bhavya's Companion");
      }
    } catch (e) {
      console.warn('Failed parsing query parameter joinCode: ', e);
    }
  }, []);

  // Story Creation states
  const [isCustomStoryImg, setIsCustomStoryImg] = useState(false);
  const [storyText, setStoryText] = useState('');
  const [storyMediaUrl, setStoryMediaUrl] = useState('');
  const [selectedStoryGrad, setSelectedStoryGrad] = useState('linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)');

  const STORY_GRADIENTS = [
    'linear-gradient(135deg, #f59e0b 0%, #e11d48 100%)',
    'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
    'linear-gradient(135deg, #f43f5e 0%, #701a75 100%)'
  ];

  // Profile Editor state
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Share & invitation stats
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Form onboarding fields (Pre-filled for Bhavya's instant access)
  const [onboardName, setOnboardName] = useState('Bhavya Sarkari');
  const [onboardEmail, setOnboardEmail] = useState('bhavyasarkari2020@gmail.com');
  const [onboardAvatar, setOnboardAvatar] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');

  // Visual options for companions matching Instagram look
  const AVATAR_OPTIONS = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  ];

  // Tab state: 'feed' or 'map_and_chat' or 'my_space'
  const [activeTab, setActiveTab] = useState<'feed' | 'map_and_chat' | 'my_space'>('feed');
  
  // Real-time Chat and Socket Connection States
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  // Calling States
  const [activeCall, setActiveCall] = useState<CallState | null>(null);

  // Live Location Toggling State ("Share-on" / "Share-off")
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const simulateIntervalRef = useRef<any>(null);

  // Decorative list state for mock likes inside feed posts
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(() => {
    try {
      const saved = localStorage.getItem('sanpython_user_posts');
      return saved ? JSON.parse(saved) : INITIAL_FEED_POSTS;
    } catch {
      return INITIAL_FEED_POSTS;
    }
  });

  // Check LocalStorage on startup for saved custom profile
  useEffect(() => {
    const saved = localStorage.getItem('instashare_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          if (!parsed.companionCode) {
            parsed.companionCode = 'SAN-' + Math.floor(1000 + Math.random() * 9000);
            localStorage.setItem('instashare_user_profile', JSON.stringify(parsed));
          }
          setCurrentUser(parsed);
          // Auto fill fields for potential edited profile starts
          setEditName(parsed.name);
          setEditEmail(parsed.email);
          setEditAvatar(parsed.avatar);
          setIsLoggingIn(false);
          return;
        }
      } catch (e) {
        console.error('Error parsed user profile state:', e);
      }
    }
    // Hold spinner temporarily for aesthetic experience
    const autoLogin = setTimeout(() => {
      setIsLoggingIn(false);
    }, 1200);

    return () => clearTimeout(autoLogin);
  }, []);

  // Sync / Connect WebSocket server when logged in
  useEffect(() => {
    if (!currentUser) return;

    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const host = window.location.host;
    const socketUrl = `${protocol}${host}`;

    const connectSocket = () => {
      const ws = new WebSocket(socketUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        // Register user identity inside full-stack websocket connection
        ws.send(JSON.stringify({
          type: 'join',
          payload: { user: currentUser }
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          switch (type) {
            case 'users_update': {
              const { users } = payload;
              setActiveUsers(users);
              break;
            }
            case 'message_history': {
              const { messages: history } = payload;
              setMessages(history);
              break;
            }
            case 'new_message': {
              const { message } = payload;
              setMessages(prev => {
                // Ensure message isn't already added to prevent packet doubling
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
              });
              break;
            }
            case 'incoming_call': {
              const { call } = payload;
              setActiveCall({ ...call, status: 'ringing' });
              break;
            }
            case 'call_status_update': {
              const { status } = payload;
              if (status === 'ended' || status === 'declined') {
                setActiveCall(null);
                alert('Call ended by structural partner.');
              } else {
                setActiveCall(prev => prev ? { ...prev, status } : null);
              }
              break;
            }
            case 'stories_history': {
              const { stories: list } = payload;
              setStories(list || []);
              break;
            }
            case 'stories_update': {
              const { stories: list } = payload;
              setStories(list || []);
              break;
            }
            default:
              break;
          }
        } catch (err) {
          console.error('Failed parsing direct message packet: ', err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        // Reconnection interval
        setTimeout(connectSocket, 3000);
      };
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [currentUser]);

  // Handle Geolocation watch and simulate positioning when turned on
  useEffect(() => {
    if (isSharingLocation && currentUser) {
      // A) Start monitoring actual browser GPS coordinates if permissions permit
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            const updatedLoc: UserLocation = {
              lat: latitude,
              lng: longitude,
              accuracy,
              updatedAt: Date.now()
            };
            setCurrentCoords({ lat: latitude, lng: longitude });
            // Broadcast live location coordinate via WebSockets
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({
                type: 'update_location',
                payload: {
                  location: updatedLoc,
                  isSharingLocation: true
                }
              }));
            }
          },
          (error) => {
            console.warn('Geolocation permission blocked or timed out. Initiating tracking journey simulation.', error);
            startLocationSimulation();
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      } else {
        startLocationSimulation();
      }
    } else {
      // Clean up tracking watch & simulation loop
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isSharingLocation, currentUser]);

  const stopTracking = () => {
    // 1. Clear native browser watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    // 2. Clear simulation loop
    if (simulateIntervalRef.current) {
      clearInterval(simulateIntervalRef.current);
      simulateIntervalRef.current = null;
    }
    setCurrentCoords(null);
    // Send disabled packet to clear from map
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'update_location',
        payload: {
          location: null,
          isSharingLocation: false
        }
      }));
    }
  };

  // High-fidelity map routing movement simulator if GPS blocked/not running on desktop
  const startLocationSimulation = () => {
    if (simulateIntervalRef.current) return;

    // Start with precise coordinates in Delhi, India close to Alex Rivera to show interactive proximity
    let simLat = 28.6304 + (Math.random() - 0.5) * 0.005;
    let simLng = 77.2177 + (Math.random() - 0.5) * 0.005;

    const pushSimCoords = () => {
      // Slowly move simulation coordinate on periodic step (e.g., walking/driving feel in India)
      simLat += (Math.random() - 0.5) * 0.0002;
      simLng += (Math.random() - 0.5) * 0.0002;

      const updatedLoc: UserLocation = {
        lat: simLat,
        lng: simLng,
        accuracy: 8,
        updatedAt: Date.now()
      };
      setCurrentCoords({ lat: simLat, lng: simLng });

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'update_location',
          payload: {
            location: updatedLoc,
            isSharingLocation: true
          }
        }));
      }
    };

    pushSimCoords();
    simulateIntervalRef.current = setInterval(pushSimCoords, 4000);
  };

  // Chat message sender handler
  const handleSendMessage = (text: string, recipientId: string | null = null, media?: { url: string; type: 'image' | 'video' }) => {
    if (!currentUser || !socketRef.current) return;

    // Use sorting rules if there is an active direct recipient to build consistent room ids between buddies
    const calculatedRoomId = recipientId 
      ? [currentUser.id, recipientId].sort().join('_')
      : 'all_chat';

    const payloadMsg = {
      id: 'msg_' + Math.random().toString(36).substring(2, 11),
      roomId: calculatedRoomId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: text,
      mediaUrl: media?.url,
      mediaType: media?.type,
      timestamp: Date.now()
    };

    socketRef.current.send(JSON.stringify({
      type: 'send_message',
      payload: { message: payloadMsg }
    }));
  };

  // Add Friend helper by Code
  const handleAddFriendByCode = (code: string): string | null => {
    const cleanCode = code.trim().toUpperCase();
    if (!currentUser) return null;

    // 1. Search in online activeUsers
    const onlineMatched = activeUsers.find(u => u.companionCode?.toUpperCase() === cleanCode);
    if (onlineMatched) {
      if (!addedFriendIds.includes(onlineMatched.id)) {
        const nextFriends = [...addedFriendIds, onlineMatched.id];
        setAddedFriendIds(nextFriends);
        localStorage.setItem('sanpython_added_friends', JSON.stringify(nextFriends));
      }
      return onlineMatched.name;
    }

    return null;
  };

  // Publish dynamic stories
  const handlePublishStory = (storyData: { mediaUrl?: string; captionText?: string; backgroundGradient?: string }) => {
    if (!currentUser || !socketRef.current) return;

    socketRef.current.send(JSON.stringify({
      type: 'post_story',
      payload: {
        mediaUrl: storyData.mediaUrl,
        captionText: storyData.captionText,
        backgroundGradient: storyData.backgroundGradient
      }
    }));
  };

  // Reply to interactive stories from fullscreen view ports
  const handleReplyToStory = (recipientId: string, replyText: string) => {
    handleSendMessage(replyText, recipientId);
  };

  // Publish a custom post
  const handleAddPost = (postData: { mediaUrl: string; mediaType: 'image' | 'video'; caption: string; location?: string; isCustom?: boolean }) => {
    if (!currentUser) return;
    const newPost: FeedPost = {
      id: 'custom_post_' + Date.now().toString(),
      username: currentUser.name,
      userAvatar: currentUser.avatar,
      mediaUrl: postData.mediaUrl,
      mediaType: postData.mediaType,
      caption: postData.caption,
      location: postData.location,
      likes: 0,
      timestamp: 'just now',
      liked: false,
      isCustom: true
    };
    const updated = [newPost, ...feedPosts];
    setFeedPosts(updated);
    localStorage.setItem('sanpython_user_posts', JSON.stringify(updated));
  };

  // Calling Initiation handler
  const handleInitiateCall = (receiverId: string, type: 'audio' | 'video') => {
    if (!currentUser || !socketRef.current) return;

    const callPayload: CallState = {
      id: 'call_' + Math.random().toString(36).substring(2, 11),
      callerId: currentUser.id,
      callerName: currentUser.name,
      callerAvatar: currentUser.avatar,
      receiverId: receiverId,
      type: type,
      status: 'calling'
    };

    setActiveCall(callPayload);

    // Deliver Dial Signal to express server WS
    socketRef.current.send(JSON.stringify({
      type: 'call_initiate',
      payload: { call: callPayload }
    }));
  };

  const handleDeclineCall = () => {
    if (!activeCall || !socketRef.current) return;
    socketRef.current.send(JSON.stringify({
      type: 'call_response',
      payload: {
        callId: activeCall.id,
        callerId: activeCall.callerId,
        receiverId: activeCall.receiverId,
        status: 'declined'
      }
    }));
    setActiveCall(null);
  };

  const handleAnswerCall = () => {
    if (!activeCall || !socketRef.current) return;
    socketRef.current.send(JSON.stringify({
      type: 'call_response',
      payload: {
        callId: activeCall.id,
        callerId: activeCall.callerId,
        receiverId: activeCall.receiverId,
        status: 'connected'
      }
    }));
    setActiveCall({ ...activeCall, status: 'connected' });
  };

  const handleEndCall = () => {
    if (!activeCall || !socketRef.current) return;
    socketRef.current.send(JSON.stringify({
      type: 'call_response',
      payload: {
        callId: activeCall.id,
        callerId: activeCall.callerId,
        receiverId: activeCall.receiverId,
        status: 'ended'
      }
    }));
    setActiveCall(null);
  };

  // Helper trigger calling action via direct signal channel
  const sendCallSignal = (type: string, payload: any) => {
    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  // Feed interaction helper
  const handleLikePost = (postId: string) => {
    setFeedPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          liked: !p.liked,
          likes: p.liked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
  };

  // Onboarding form submission engine
  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardName.trim() || !onboardEmail.trim()) return;

    // Generate clean character ID from name and email base
    const derivedId = 'user_' + onboardEmail.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const helperCode = 'SAN-' + Math.floor(1000 + Math.random() * 9000);

    const newUser: AppUser = {
      id: derivedId,
      name: onboardName.trim(),
      email: onboardEmail.trim(),
      avatar: onboardAvatar,
      status: 'online',
      isSharingLocation: false,
      companionCode: helperCode
    };

    // Auto link friends if invited by invite code
    if (invitedCode) {
      // Find friend by invite code
      const matchedCreator = activeUsers.find(u => u.companionCode?.toUpperCase() === invitedCode.toUpperCase());
      const initialFriends = [...addedFriendIds];
      if (matchedCreator && !initialFriends.includes(matchedCreator.id)) {
        initialFriends.push(matchedCreator.id);
      }
      setAddedFriendIds(initialFriends);
      localStorage.setItem('sanpython_added_friends', JSON.stringify(initialFriends));
    }

    localStorage.setItem('instashare_user_profile', JSON.stringify(newUser));
    setCurrentUser(newUser);

    // Populate active edit inputs of overlay form
    setEditName(newUser.name);
    setEditEmail(newUser.email);
    setEditAvatar(newUser.avatar);
  };

  // Profile save details
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editName.trim() || !editEmail.trim()) return;

    const updatedUser: AppUser = {
      ...currentUser,
      name: editName.trim(),
      email: editEmail.trim(),
      avatar: editAvatar
    };

    localStorage.setItem('instashare_user_profile', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    setProfileEditorOpen(false);

    // Instantly transmit updated identity across all online WebSocket connections
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'join',
        payload: { user: updatedUser }
      }));
    }
  };

  const handleUpdateProfile = (name: string, email: string, avatar: string, code: string, bio?: string, website?: string) => {
    if (!currentUser) return;
    const updatedUser: AppUser = {
      ...currentUser,
      name,
      email,
      avatar,
      companionCode: code,
      bio,
      website
    };
    localStorage.setItem('instashare_user_profile', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    
    // Auto fill fields for potential edited profile starts
    setEditName(name);
    setEditEmail(email);
    setEditAvatar(avatar);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'join',
        payload: { user: updatedUser }
      }));
    }
  };

  // Invite friends share clipboard triggers
  const copyShareLink = () => {
    navigator.clipboard.writeText('https://ais-pre-nwdgutn5ci5gsza6x7kgbf-78987371243.asia-southeast1.run.app');
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  if (isLoggingIn) {
    return (
      <div id="loading-authenticator" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 rounded-full animate-ping blur opacity-25"></div>
            <Instagram className="w-16 h-16 text-pink-500 relative animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-lg tracking-wide uppercase">Instashare OAuth Setup</h3>
            <p className="text-2xs font-mono text-indigo-400 mt-1">Establishing Google login token ...</p>
          </div>
          <p className="text-3xs text-slate-500 px-6 leading-relaxed font-sans">
            Automatically signing in Gmail profile <code className="text-slate-400 font-mono">bhavyasarkari2020@gmail.com</code> for instant gateway access.
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div id="instashare-onboarding-wrapper" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4 relative overflow-hidden">
        {/* Colorful background radial decorations */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>

        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl relative">
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="p-3.5 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 rounded-2xl text-white shadow-xl animate-bounce">
              <Instagram className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-bold text-xl tracking-tight text-white uppercase font-sans">Welcome to Instashare Live</h2>
              <p className="text-3xs text-slate-400 font-medium font-mono uppercase tracking-widest mt-1">Real-time Location Share, Call & Chat Gateway</p>
            </div>
          </div>

          <form onSubmit={handleOnboardSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono mb-2">Your Full Name</label>
              <input
                type="text"
                required
                value={onboardName}
                onChange={(e) => setOnboardName(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 text-xs px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-colors"
                placeholder="e.g. Bhavya Sarkari or Emily Watson"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono mb-2">Gmail / Identity ID</label>
              <input
                type="email"
                required
                value={onboardEmail}
                onChange={(e) => setOnboardEmail(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 text-xs px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-colors font-mono"
                placeholder="gmail@example.com"
              />
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed font-sans">
                💡 Gmail ID is logged in automatically once entered. Use different IDs on different devices/browsers to test chatting, calling and map updates with your friend!
              </p>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono mb-2.5">Choose Avatar Companion</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map((av, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setOnboardAvatar(av)}
                    className={`relative rounded-full aspect-square overflow-hidden p-0.5 border-2 transition-all cursor-pointer hover:scale-105 ${
                      onboardAvatar === av 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <img src={av} className="w-full h-full rounded-full object-cover" />
                  </button>
                ))}
              </div>
              
              <div className="mt-3.5">
                <label className="block text-[9px] text-slate-500 mb-1">Or enter a custom Image URL:</label>
                <input
                  type="text"
                  value={onboardAvatar}
                  onChange={(e) => setOnboardAvatar(e.target.value)}
                  className="w-full bg-slate-950/70 text-slate-400 text-[10px] px-3 py-2 rounded-lg border border-slate-800 outline-none focus:border-slate-700 font-mono truncate"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-600 hover:opacity-95 active:scale-[0.99] transition-all text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-pink-500/10 cursor-pointer"
            >
              Sign In and Connect Chat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      
      {/* Dynamic Voice & Video Calling Screen Overlay */}
      <CallingOverlay
        call={activeCall}
        onAnswer={handleAnswerCall}
        onDecline={handleDeclineCall}
        onEnd={handleEndCall}
        currentUser={currentUser}
        activeUsers={activeUsers}
        sendSignal={sendCallSignal}
      />

      {/* Main Top Header Navbar with Brand Identity */}
      <header id="app-header-nav" className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        
        {/* Logo and Brand Title Pairing */}
        <div className="flex items-center space-x-3 select-none">
          <div className="p-2 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 rounded-xl text-white shadow-xl">
            <Instagram className="w-5 h-5" />
          </div>
          <div>
            <h1 id="brand-instagram-label" className="font-bold text-sm tracking-widest uppercase bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Sanpython
            </h1>
            <p className="text-[10px] text-slate-500 font-semibold font-mono uppercase">Sanpython social media</p>
          </div>
        </div>

        {/* Live Location Switcher: "Share-on, Share-off" Feature */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full">
          <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider uppercase">Live Location:</span>
          
          <div className="flex items-center gap-1.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 shrink-0">
            {/* Share Location OFF button */}
            <button
              id="location-share-off"
              onClick={() => setIsSharingLocation(false)}
              className={`px-3 py-1 text-3xs font-bold rounded cursor-pointer transition-all ${
                !isSharingLocation 
                  ? 'bg-red-600 text-white shadow' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Share-Off
            </button>
            {/* Share Location ON button */}
            <button
              id="location-share-on"
              onClick={() => setIsSharingLocation(true)}
              className={`px-3 py-1 text-3xs font-bold rounded cursor-pointer transition-all ${
                isSharingLocation 
                  ? 'bg-emerald-500 text-white shadow' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Share-On
            </button>
          </div>

          {/* Active GPS status flag */}
          {isSharingLocation && (
            <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-semibold animate-pulse mr-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
              Broadcasting GPS
            </span>
          )}
        </div>

        {/* Fast User Identity status badge with Invite & Edit widgets */}
        <div className="flex items-center gap-2">
          {/* Invite button */}
          <button
            onClick={() => {
              setSharePanelOpen(true);
              setProfileEditorOpen(false);
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 via-pink-600 to-indigo-600 hover:opacity-90 active:scale-95 transition-all text-white px-3 py-1.5 rounded-xl text-3xs font-bold tracking-wider uppercase cursor-pointer shadow-lg shadow-pink-500/10"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invite Friends</span>
          </button>

          {currentUser && (
            <div className="flex items-center gap-2.5 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-2xl">
              <div className="relative cursor-pointer group" onClick={() => {
                setEditName(currentUser.name);
                setEditEmail(currentUser.email);
                setEditAvatar(currentUser.avatar);
                setProfileEditorOpen(true);
                setSharePanelOpen(false);
              }}>
                <img 
                  src={currentUser.avatar} 
                  className="w-7 h-7 rounded-full object-cover border border-slate-800 group-hover:scale-105 transition-all"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900"></span>
                <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[8px] text-white">
                  Edit
                </div>
              </div>
              <div className="leading-tight text-left">
                <p className="text-xs font-bold text-slate-200 flex items-center gap-1">
                  {currentUser.name}
                  <button onClick={() => {
                    setEditName(currentUser.name);
                    setEditEmail(currentUser.email);
                    setEditAvatar(currentUser.avatar);
                    setProfileEditorOpen(true);
                    setSharePanelOpen(false);
                  }} className="text-slate-500 hover:text-indigo-400 p-0.5 cursor-pointer" title="Edit Profile Details">
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                </p>
                <p className="text-[8px] text-slate-500 font-mono lowercase truncate max-w-28 leading-none mt-0.5">{currentUser.email}</p>
              </div>
            </div>
          )}
        </div>

      </header>

      {/* Primary Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Horizontal scroll stories board (Displays online participants with brand gradient ring) */}
        <div id="instagram-stories-panel" className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex gap-4 overflow-x-auto select-none items-center">
          {/* Post Story Bubble */}
          <div 
            onClick={() => setIsCreatingStory(true)}
            className="flex flex-col items-center gap-1.5 shrink-0 text-center cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-full p-0.5 bg-slate-950 border border-dashed border-indigo-500/50 flex items-center justify-center overflow-hidden hover:border-indigo-400 relative">
              <img src={currentUser?.avatar} className="w-full h-full rounded-full object-cover opacity-60 group-hover:opacity-85" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg text-indigo-400 font-bold leading-none">+</span>
              </div>
            </div>
            <span className="text-[9px] text-slate-400 font-mono font-semibold max-w-16 truncate group-hover:text-slate-200">Post Story</span>
          </div>

          {/* Active Broadcasted Stories */}
          {stories.map((story, idx) => (
            <div 
              key={story.id} 
              onClick={() => setActiveStoryIndex(idx)}
              className="flex flex-col items-center gap-1.5 shrink-0 text-center group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 animate-pulse flex items-center justify-center overflow-hidden border border-slate-900">
                <img src={story.userAvatar} className="w-12 h-12 rounded-full object-cover bg-slate-950" referrerPolicy="no-referrer" />
              </div>
              <span className="text-[9px] text-slate-300 font-mono group-hover:text-indigo-400 transition-colors max-w-16 truncate leading-tight">
                {story.username.split(' ')[0].toLowerCase()}
              </span>
            </div>
          ))}

          {/* Fallbacks if empty stories to keep visual consistency */}
          {stories.length === 0 && activeUsers
            .filter(u => u.id !== currentUser?.id)
            .map((u) => (
              <div 
                key={u.id}
                onClick={() => {
                  const fallbackStory: UserStory = {
                    id: 'story_fallback_' + u.id,
                    userId: u.id,
                    username: u.name,
                    userAvatar: u.avatar,
                    mediaUrl: undefined,
                    backgroundGradient: 'linear-gradient(135deg, #1e1b4b 0%, #311042 100%)',
                    captionText: `Hey! I'm active on Sanpython! Track me live at companion code: ${u.companionCode || 'SAN-PLAY'}`,
                    timestamp: Date.now()
                  };
                  setStories([fallbackStory]);
                  setActiveStoryIndex(0);
                }}
                className="flex flex-col items-center gap-1.5 shrink-0 text-center group cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-pink-500 via-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden border border-slate-900">
                  <img src={u.avatar} className="w-12 h-12 rounded-full object-cover bg-slate-950" referrerPolicy="no-referrer" />
                </div>
                <span className="text-[9px] text-slate-300 font-mono group-hover:text-indigo-400 transition-colors max-w-16 truncate leading-tight">
                  {u.name.split(' ')[0].toLowerCase()}
                </span>
              </div>
            ))}
        </div>

        {/* Interactive Tab headers for Desktop Layout views */}
        <div id="workspace-tabs" className="hidden md:flex flex-wrap gap-1.5 bg-slate-905/40 p-1 rounded-xl border border-slate-800 w-fit">
          <button
            id="tab-feed"
            onClick={() => setActiveTab('feed')}
            className={`px-5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'feed'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Social Visual Feed ({feedPosts.length})</span>
          </button>
          
          <button
            id="tab-map-chat"
            onClick={() => setActiveTab('map_and_chat')}
            className={`px-5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'map_and_chat'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map Coordinates & Chat Rooms</span>
          </button>

          <button
            id="tab-my-space"
            onClick={() => setActiveTab('my_space')}
            className={`px-5 py-2 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'my_space'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>My Space, Posts & Analytics</span>
          </button>
        </div>

        {/* Dynamic Section Area */}
        {activeTab === 'map_and_chat' ? (
          /* WORKSPACE TAB: Google Maps + Live Direct Messenger */
          <div id="workspace-grid-dms" className="space-y-6">
            
            {/* Split Dual column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* LEFT COLUMN: Google Maps Coordinate display */}
              <div className="lg:col-span-7 flex flex-col min-h-[420px]">
                <div className="bg-slate-950/60 p-4 border-t border-x border-slate-800 rounded-t-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-indigo-400 w-4.5 h-4.5" />
                    <span className="text-xs font-bold tracking-wider uppercase text-slate-200">Google Location Tracking Map</span>
                  </div>
                  {isSharingLocation && currentCoords && (
                    <span className="text-3xs font-mono text-indigo-400 bg-indigo-950 px-2 py-1 rounded">
                      My Coordinates: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                    </span>
                  )}
                </div>
                
                {/* Display either Google Map or mock instructions sandbox */}
                <div className="flex-1 bg-slate-950/20 rounded-b-2xl overflow-hidden border border-slate-800 h-full">
                  <GoogleMapsViewer users={activeUsers} currentUser={currentUser} />
                </div>
              </div>

              {/* RIGHT COLUMN: DM chat system */}
              <div className="lg:col-span-5 h-full">
                <ChatMessenger
                  messages={messages}
                  currentUser={currentUser}
                  activeUsers={activeUsers}
                  onSendMessage={handleSendMessage}
                  onInitiateCall={handleInitiateCall}
                  addedFriendIds={addedFriendIds}
                  onAddFriendByCode={handleAddFriendByCode}
                />
              </div>

            </div>

          </div>
        ) : activeTab === 'feed' ? (
          /* FEED TAB: Traditional Instagram Visual Grid */
          <div id="instagram-feed-grid" className="max-w-xl mx-auto space-y-6">
            
            {feedPosts.map(post => (
              <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                
                {/* Header info */}
                <div className="p-4.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={post.userAvatar} className="w-8 h-8 rounded-full object-cover border border-slate-800" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="font-bold text-xs text-slate-200 leading-tight">{post.username}</h4>
                      {post.location && <p className="text-[9px] text-slate-400/80 mt-0.5">{post.location}</p>}
                    </div>
                  </div>
                  <HelpCircle className="w-4 h-4 text-slate-500 hover:text-slate-400 cursor-pointer" />
                </div>

                {/* Media representation */}
                <div className="bg-slate-950 border-y border-slate-800 relative select-none">
                  <img src={post.mediaUrl} className="w-full max-h-[460px] object-cover" referrerPolicy="no-referrer" />
                </div>

                {/* Direct Action buttons */}
                <div className="p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-slate-300">
                      <button onClick={() => handleLikePost(post.id)} className="hover:text-pink-500 scale-102 transition-colors cursor-pointer">
                        <Heart className={`w-6 h-6 ${post.liked ? 'fill-pink-500 text-pink-500' : ''}`} />
                      </button>
                      <button onClick={() => {
                        setActiveTab('map_and_chat');
                      }} className="hover:text-indigo-400 scale-102 transition-colors cursor-pointer">
                        <MessageCircle className="w-6 h-6" />
                      </button>
                      <Share2 className="w-5 h-5 hover:text-emerald-400 transition-colors cursor-pointer" />
                    </div>
                    <Bookmark className="w-5 h-5 text-slate-400 hover:text-white transition-colors cursor-pointer" />
                  </div>

                  {/* Comments count / textual representation */}
                  <div className="space-y-1.5 text-xs text-left">
                    <p className="font-semibold text-white">{post.likes.toLocaleString()} likes</p>
                    <p className="leading-relaxed">
                      <span className="font-bold mr-2 text-white">{post.username}</span>
                      <span className="text-slate-300">{post.caption}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">{post.timestamp}</p>
                  </div>
                </div>

              </div>
            ))}

          </div>
        ) : (
          /* MY SPACE TAB: Dynamic profile and analytics bento grid dashboard */
          <div className="space-y-6">
            <MySpaceDashboard
              currentUser={currentUser}
              feedPosts={feedPosts}
              onUpdateProfile={handleUpdateProfile}
              onAddPost={handleAddPost}
            />
          </div>
        )}

      </main>

      {/* Settings Profile Editor ID Modal (Dynamic) */}
      {profileEditorOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative text-slate-100">
            <button 
              onClick={() => setProfileEditorOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-5 flex flex-col items-center">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">Custom Profile / Edit ID</h3>
              <p className="text-3xs text-slate-500 font-medium">Instantly updates your companion across all users</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-3xs font-bold uppercase text-slate-400 font-mono mb-1 text-left">Display Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold uppercase text-slate-400 font-mono mb-1 text-left">Unique Email / ID</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold uppercase text-slate-400 font-mono mb-2 text-left">Companion Avatar Option</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVATAR_OPTIONS.map((av, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setEditAvatar(av)}
                      className={`relative rounded-full aspect-square overflow-hidden p-0.5 border-2 transition-all cursor-pointer hover:scale-105 ${
                        editAvatar === av ? 'border-indigo-500' : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <img src={av} className="w-full h-full rounded-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  className="w-full bg-slate-100/10 text-slate-400 text-[9px] mt-2.5 px-2 py-1.5 rounded border border-slate-800 outline-none font-mono truncate"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setProfileEditorOpen(false)}
                  className="flex-1 py-2.5 border border-slate-800 hover:bg-slate-900 rounded-xl text-3xs uppercase font-bold tracking-wider text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all text-white font-bold text-3xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share App / Invite Friends Panel Overlay (Dynamic) */}
      {sharePanelOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
            <button 
              onClick={() => setSharePanelOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">Invite Friends & Chat</h3>
              <p className="text-3xs text-slate-500 mt-1 max-w-[250px] leading-relaxed">
                Send this secure web link to your buddies. They can log in with their own unique IDs and immediately map-track and DM in real-time!
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="block text-[8px] text-slate-500 uppercase tracking-wider font-semibold font-mono mb-1.5">Direct Invitation Link</span>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 text-4xs font-mono text-slate-400 truncate bg-slate-900/40 p-2.5 rounded-lg border border-slate-900 leading-tight select-all">
                    https://ais-pre-nwdgutn5ci5gsza6x7kgbf-78987371243.asia-southeast1.run.app
                  </div>
                  <button
                    onClick={copyShareLink}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl active:scale-95 transition-all shrink-0 cursor-pointer"
                    title="Copy to clipboard"
                  >
                    {inviteCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {inviteCopied && (
                  <p className="text-[9px] text-emerald-400 font-mono font-medium mt-1">✓ Link Copied! Send it to your friends!</p>
                )}
              </div>

              {/* Dynamic QR illustration widget */}
              <div className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl">
                <div className="w-11 h-11 bg-white rounded-lg p-1 shrink-0 flex flex-col items-center justify-center">
                  <div className="grid grid-cols-4 gap-0.5 w-[32px] h-[32px]">
                    <div className="bg-black rounded-sm"></div>
                    <div className="bg-black rounded-sm"></div>
                    <div className="bg-black rounded-sm"></div>
                    <div className="bg-slate-300"></div>
                    
                    <div className="bg-black"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-black"></div>
                    <div className="bg-black"></div>

                    <div className="bg-slate-400"></div>
                    <div className="bg-black"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-black"></div>

                    <div className="bg-black rounded-sm"></div>
                    <div className="bg-black"></div>
                    <div className="bg-black"></div>
                    <div className="bg-black rounded-sm"></div>
                  </div>
                </div>
                <div className="leading-tight text-left">
                  <span className="text-3xs uppercase font-bold text-slate-300 tracking-wider font-mono">Scan Visual Code</span>
                  <p className="text-[8px] text-slate-500 mt-0.5">Bring another phone to scan this screen and join the mapping playground!</p>
                </div>
              </div>

              <button
                onClick={() => setSharePanelOpen(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-3xs uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer Overlay Fullscreen (Handles View + Post Creation) */}
      {(activeStoryIndex !== null || isCreatingStory) && (
        <StoryViewerOverlay
          activeStoryIndex={activeStoryIndex}
          stories={stories}
          currentUser={currentUser}
          onClose={() => setActiveStoryIndex(null)}
          onNext={() => {
            if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
              setActiveStoryIndex(activeStoryIndex + 1);
            } else {
              setActiveStoryIndex(null);
            }
          }}
          onPrev={() => {
            if (activeStoryIndex !== null && activeStoryIndex > 0) {
              setActiveStoryIndex(activeStoryIndex - 1);
            }
          }}
          onReplyToStory={handleReplyToStory}
          isCreatingStory={isCreatingStory}
          onCloseCreate={() => setIsCreatingStory(false)}
          onPublishStory={(storyData) => {
            handlePublishStory(storyData);
            setIsCreatingStory(false);
          }}
        />
      )}

      {/* 📸 STICKY NATIVE BOTTOM NAVIGATION DRAWER BAR (Perfect for native touch and mobile sizing) */}
      <div id="instagram-bottom-nav" className="sticky bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-900/80 backdrop-blur-md flex items-center justify-around py-3.5 px-3 md:hidden shadow-2xl">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center gap-1 transition-all focus:outline-none ${
            activeTab === 'feed' ? 'text-pink-500 scale-102 font-semibold' : 'text-slate-400'
          }`}
        >
          <Tv className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">Feed</span>
        </button>
        <button
          onClick={() => setActiveTab('map_and_chat')}
          className={`flex flex-col items-center gap-1 transition-all focus:outline-none ${
            activeTab === 'map_and_chat' ? 'text-pink-500 scale-102 font-semibold' : 'text-slate-400'
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">Map & Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('my_space')}
          className={`flex flex-col items-center gap-1 transition-all focus:outline-none ${
            activeTab === 'my_space' ? 'text-pink-500 scale-102 font-semibold' : 'text-slate-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] tracking-wide">Profile</span>
        </button>
      </div>

      {/* Simple decorative footer */}
      <footer className="border-t border-slate-900 py-5 text-center bg-slate-950 text-3xs text-slate-600 tracking-wider">
        <p>SANPYTHON REAL-TIME LOCATION CHAT SERVICE • POWERED BY GOOGLE MAPS PLATFORM & WEBSOCKETS</p>
        <p className="mt-1">All realtime modules and backend peer gateways listening active on port 3000</p>
      </footer>
    </div>
  );
}
