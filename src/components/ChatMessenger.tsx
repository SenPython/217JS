import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Video, Phone, Video as VideoIcon, User, Paperclip, Check, CheckCheck, MapPin, Search, Loader2, UserPlus, Sparkles, CheckCircle2 } from 'lucide-react';
import { Message, User as AppUser } from '../types';

interface ChatMessengerProps {
  messages: Message[];
  currentUser: AppUser | null;
  activeUsers: AppUser[];
  onSendMessage: (text: string, recipientId: string | null, media?: { url: string; type: 'image' | 'video' }) => void;
  onInitiateCall: (receiverId: string, type: 'audio' | 'video') => void;
  addedFriendIds: string[];
  onAddFriendByCode: (code: string) => string | null;
}

export default function ChatMessenger({
  messages,
  currentUser,
  activeUsers,
  onSendMessage,
  onInitiateCall,
  addedFriendIds,
  onAddFriendByCode
}: ChatMessengerProps) {
  const [inputText, setInputText] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(null); // null means All Members group
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom companion code input states
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // File attachments state
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Filter messages based on Selected DM user or Group Chat
  const filteredMessages = messages.filter(msg => {
    if (selectedUserFilter === null) {
      return msg.roomId === 'all_chat';
    } else {
      // Direct message: sender is current and receiver is selected, OR sender is selected and receiver is current
      const isDMBetweenUs = 
        (msg.senderId === currentUser?.id && msg.roomId === `dm_${selectedUserFilter}`) ||
        (msg.senderId === selectedUserFilter && msg.roomId === `dm_${currentUser?.id}`) ||
        // also fallback ifroomId is constructed as sorted ID
        msg.roomId === [currentUser?.id, selectedUserFilter].sort().join('_');
      return isDMBetweenUs;
    }
  });

  // Auto scroll to latest message inside the chat container ONLY (does NOT scroll the parent window/page down!)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [filteredMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedMedia) return;

    onSendMessage(
      inputText, 
      selectedUserFilter,
      attachedMedia ? { url: attachedMedia.url, type: attachedMedia.type } : undefined
    );
    
    setInputText('');
    setAttachedMedia(null);
  };

  // Convert uploaded image or video to Base64 to share natively in real time
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result) {
        const urlStr = event.target.result as string;
        const fileType = file.type.startsWith('video/') ? 'video' : 'image';
        setAttachedMedia({
          url: urlStr,
          type: fileType as 'image' | 'video'
        });
      }
      setIsUploading(false);
    };

    reader.onerror = () => {
      alert('Error reading local file.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const getPartner = () => {
    if (selectedUserFilter === null) return null;
    return activeUsers.find(u => u.id === selectedUserFilter) || null;
  };

  const partner = getPartner();

  return (
    <div id="instagram-dm-container" className="flex h-[420px] md:h-[480px] lg:h-[550px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      
      {/* LEFT PANEL: Users List & Threads */}
      <div className="w-64 border-r border-slate-800 bg-slate-950/40 p-4 flex flex-col space-y-4 shrink-0 hidden md:flex">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold text-sm tracking-wide text-white uppercase font-sans">Messages</h3>
          <span className="text-3xs bg-slate-800 border border-slate-705 px-2 py-0.5 rounded-full text-indigo-400 font-mono font-bold">
            {activeUsers.length} ONLINE
          </span>
        </div>

        {/* Search Input Bar for Finding Friends */}
        <div className="px-2 pb-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search companion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 text-slate-200 text-3xs rounded-lg pl-8 pr-3 py-2 outline-none border border-slate-800/80 focus:border-indigo-500 transition-colors placeholder:text-slate-500 font-mono"
            />
            <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* Add Friend by Code Section */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-left space-y-1.5 mx-2">
          <span className="text-[8.5px] uppercase font-bold text-slate-400 font-mono flex items-center gap-1">
            <UserPlus className="w-3 h-3 text-indigo-400" /> Add Friend by Code
          </span>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if(!friendCodeInput.trim()) return;
              setAddError(null);
              setAddSuccess(null);
              const nameAdded = onAddFriendByCode(friendCodeInput.trim().toUpperCase());
              if (nameAdded) {
                setAddSuccess(`Added ${nameAdded}!`);
                setFriendCodeInput('');
                setTimeout(() => setAddSuccess(null), 3000);
              } else {
                setAddError('Companion not found online');
                setTimeout(() => setAddError(null), 3000);
              }
            }} 
            className="flex gap-1"
          >
            <input
              type="text"
              required
              placeholder="e.g. SAN-ALEX"
              value={friendCodeInput}
              onChange={(e) => setFriendCodeInput(e.target.value)}
              className="flex-1 bg-slate-900/90 text-slate-100 text-[9px] rounded px-2 py-1 outline-none border border-slate-800 focus:border-indigo-500 font-mono uppercase"
            />
            <button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 px-2.5 py-1 rounded text-4xs font-bold uppercase text-white transition-all cursor-pointer h-[24px]"
            >
              Add
            </button>
          </form>
          {addSuccess && <p className="text-[8px] text-emerald-400 font-semibold font-mono">{addSuccess}</p>}
          {addError && <p className="text-[8px] text-red-400 font-semibold font-mono">{addError}</p>}
        </div>

        {/* Global Chat Rooms */}
        <div className="space-y-1.5 flex-1 overflow-y-auto">
          <p className="text-[10px] text-slate-500 font-semibold font-mono tracking-wider px-2 uppercase mb-1">Direct Rooms</p>
          
          <button
            id="choose-group-all-chat"
            onClick={() => setSelectedUserFilter(null)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
              selectedUserFilter === null 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 font-medium' 
                : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              ALL
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-semibold truncate text-white">General Group Chat</p>
              <p className="text-[10px] opacity-80 mt-0.5 truncate">Public Instagram feed</p>
            </div>
          </button>

          <p className="text-[10px] text-slate-500 font-semibold font-mono tracking-wider px-2 uppercase mt-4 mb-2">My Friends (SAN Verified)</p>
          
          <div className="space-y-1">
            {activeUsers
              .filter(u => u.id !== currentUser?.id && (addedFriendIds.includes(u.id) || u.id.startsWith('bot_')) && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(u => (
                <button
                  key={u.id}
                  id={`choose-user-dm-${u.id}`}
                  onClick={() => setSelectedUserFilter(u.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    selectedUserFilter === u.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 font-medium' 
                      : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img src={u.avatar} className="w-9 h-9 rounded-full object-cover border border-slate-800" referrerPolicy="no-referrer" />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${u.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'} border-2 border-slate-950`}></span>
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <p className={`text-xs font-semibold truncate ${selectedUserFilter === u.id ? 'text-white' : 'text-slate-20s'}`}>{u.name}</p>
                    <p className="text-[10px] opacity-75 truncate">{u.isSharingLocation ? '🗺️ Live Sharing On' : 'Offline tracking'}</p>
                  </div>
                </button>
              ))}
          </div>

          {activeUsers.filter(u => u.id !== currentUser?.id && !addedFriendIds.includes(u.id) && !u.id.startsWith('bot_')).length > 0 && (
            <>
              <p className="text-[10px] text-slate-500 font-semibold font-mono tracking-wider px-2 uppercase mt-4 mb-2">Other Active Peers</p>
              <div className="space-y-1">
                {activeUsers
                  .filter(u => u.id !== currentUser?.id && !addedFriendIds.includes(u.id) && !u.id.startsWith('bot_'))
                  .map(u => (
                    <div key={u.id} className="w-full flex items-center justify-between p-2 rounded-xl text-left bg-slate-950/25 border border-slate-900/40">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <img src={u.avatar} className="w-7 h-7 rounded-full object-cover shrink-0" referrerpolicy="no-referrer" />
                        <div className="overflow-hidden">
                          <p className="text-[10.5px] font-semibold truncate text-slate-300 leading-none">{u.name}</p>
                          <span className="text-[8px] font-mono text-indigo-400 mt-1 block tracking-wider uppercase">{u.companionCode}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => onAddFriendByCode(u.companionCode || '')}
                        className="bg-slate-800 hover:bg-indigo-600 p-1 rounded hover:text-white text-slate-400 cursor-pointer shrink-0 transition-all"
                        title="Add Friend Quickly"
                      >
                        <UserPlus className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Chat Workspace */}
      <div className="flex-1 flex flex-col bg-slate-900/40 relative">
        
        {/* Chat Area Header */}
        <div className="bg-slate-950/70 py-3.5 px-4.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {partner ? (
              <>
                <div className="relative">
                  <img src={partner.avatar} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${partner.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'} border-2 border-slate-950`}></span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white leading-tight">{partner.name}</h4>
                  <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                    {partner.isSharingLocation ? (
                      <span className="text-indigo-400 font-semibold">• Live Position Sharing ON</span>
                    ) : (
                      <span>• Location tracking off</span>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
                  GP
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white leading-tight">General Public Chat Feed</h4>
                  <p className="text-[9px] text-slate-400 mt-0.5">• Broadcasts to all online Instagram peers</p>
                </div>
              </>
            )}
          </div>

          {/* Quick Calling Integration (for direct DMs or Group Audio Calls) */}
          {partner && (
            <div className="flex items-center gap-2">
              <button
                id="dial-audio-call"
                onClick={() => onInitiateCall(partner.id, 'audio')}
                className="p-2.5 bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Start Audio Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                id="dial-video-call"
                onClick={() => onInitiateCall(partner.id, 'video')}
                className="p-2.5 bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Start Video Call"
              >
                <VideoIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Messaging Body container */}
        <div ref={scrollContainerRef} className="flex-1 min-h-0 p-4.5 overflow-y-auto space-y-4">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((msg) => {
              const isMine = msg.senderId === currentUser?.id;
              return (
                <div key={msg.id} className={`flex items-start gap-2.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                  
                  {/* Sender Avatar if not mine */}
                  {!isMine && (
                    <img 
                      src={msg.senderAvatar} 
                      className="w-7 h-7 rounded-full object-cover mt-0.5" 
                      referrerPolicy="no-referrer"
                    />
                  )}

                  <div className={`max-w-[70%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    {/* Sender name for group chat */}
                    {!isMine && selectedUserFilter === null && (
                      <span className="text-[9px] text-slate-500 font-semibold mb-1 ml-1">
                        {msg.senderName}
                      </span>
                    )}

                    {/* Chat Bubble card */}
                    <div className={`p-3.5 rounded-2xl text-xs space-y-2 ${
                      isMine 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}>
                      
                      {/* Attached Image payload */}
                      {msg.mediaUrl && msg.mediaType === 'image' && (
                        <div className="rounded-xl overflow-hidden border border-black/10 max-w-full">
                          <img 
                            src={msg.mediaUrl} 
                            className="max-h-60 w-full object-contain" 
                            alt="Shared" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* Attached Video payload */}
                      {msg.mediaUrl && msg.mediaType === 'video' && (
                        <div className="rounded-xl overflow-hidden border border-black/10 max-w-full bg-black">
                          <video 
                            src={msg.mediaUrl} 
                            controls 
                            className="max-h-60 w-full object-contain"
                          />
                        </div>
                      )}

                      {/* Text content */}
                      {msg.text && <p className="leading-relaxed break-words">{msg.text}</p>}

                    </div>

                    {/* Timestamp & Status indicators */}
                    <div className="flex items-center gap-1 text-[8px] text-slate-500 mt-1 mr-1">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMine && <CheckCheck className="w-3 h-3 text-indigo-400" />}
                    </div>

                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-600">
              <Send className="w-8 h-8 mb-2 opacity-25 text-slate-500" />
              <p className="text-xs font-mono">No messages in thread.</p>
              <p className="text-[10px] text-slate-500/80 mt-1 font-sans">
                Type a message below or upload files to start chatting.
              </p>
            </div>
          )}
        </div>

        {/* Draft media attachment preview block */}
        {attachedMedia && (
          <div className="absolute bottom-18 left-4 right-4 bg-slate-950 border border-indigo-500/30 p-2.5 rounded-xl flex items-center justify-between animate-fade-in shadow-2xl z-10">
            <div className="flex items-center gap-3">
              {attachedMedia.type === 'image' ? (
                <img src={attachedMedia.url} className="w-12 h-12 rounded-lg object-cover border border-slate-800" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-pink-950 border border-slate-800 flex items-center justify-center">
                  <Video className="w-5 h-5 text-pink-400" />
                </div>
              )}
              <div className="leading-tight">
                <p className="text-2xs font-semibold text-white">Attachment ready</p>
                <p className="text-[9px] text-indigo-400 font-mono capitalize">{attachedMedia.type} file ready to upload</p>
              </div>
            </div>
            <button
              onClick={() => setAttachedMedia(null)}
              className="text-xs text-red-500 hover:text-red-400 font-bold px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Input Text Form Area */}
        <form onSubmit={handleSend} className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center gap-3">
          
          {/* File attachments input helper */}
          <div>
            <button
              id="attach-file-trigger"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center border border-slate-700 h-[44px] w-[44px]"
              title="Attach File (Image or Video)"
            >
              {isUploading ? (
                <Loader2 className="w-5.5 h-5.5 text-indigo-400 animate-spin" />
              ) : (
                <Paperclip className="w-4.5 h-4.5" />
              )}
            </button>
            <input
              id="chat-file-input"
              type="file"
              ref={fileInputRef}
              onChange={handleFileAttach}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>

          <input
            id="chat-message-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isUploading}
            placeholder={isUploading ? "Reading attachment..." : partner ? `Send direct message to ${partner.name}...` : "Send broadcast message to group feed..."}
            className="flex-1 bg-slate-900/80 text-xs border border-slate-805 rounded-xl py-3.5 px-4 outline-none focus:border-indigo-500 transition-all font-mono placeholder:text-slate-500"
          />

          <button
            id="chat-message-submit"
            type="submit"
            disabled={isUploading || (!inputText.trim() && !attachedMedia)}
            className="p-3 bg-indigo-500 text-white hover:bg-indigo-600 active:scale-95 disabled:bg-slate-900 disabled:text-slate-600 rounded-xl transition-all h-[44px] w-[44px] flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-500/10"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>

      </div>
    </div>
  );
}
