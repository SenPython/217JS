export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  updatedAt: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline';
  isSharingLocation: boolean;
  location?: Location;
  lastSeen?: number;
  companionCode?: string; // Unique invitation code e.g. "SAN-4821"
  friends?: string[]; // Array of added friend user IDs
  bio?: string;
  website?: string;
  followersCount?: number;
  followingCount?: number;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  mediaUrl?: string; // base64 or external url
  mediaType?: 'image' | 'video';
  timestamp: number;
}

export interface CallState {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  type: 'audio' | 'video';
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  roomId?: string; // WebSocket conference channel or sub-channel
}

export interface ChatRoom {
  id: string; // e.g. "room_1", or sorted UIDs combined "user1_user2"
  name: string;
  participants: string[]; // List of user IDs
  avatar?: string;
}

export interface UserStory {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  mediaUrl?: string;
  captionText?: string;
  backgroundGradient?: string;
  timestamp: number;
  viewers?: string[];
}

export interface FeedPost {
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
