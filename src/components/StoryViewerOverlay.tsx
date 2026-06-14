import React, { useState, useEffect, useRef } from 'react';
import { 
  UserStory, 
  User as AppUser 
} from '../types';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Image, 
  Sparkles, 
  Palette,
  Loader2,
  Check
} from 'lucide-react';

interface StoryViewerOverlayProps {
  activeStoryIndex: number | null;
  stories: UserStory[];
  currentUser: AppUser | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReplyToStory: (recipientId: string, replyText: string) => void;
  
  // Creation props
  isCreatingStory: boolean;
  onCloseCreate: () => void;
  onPublishStory: (storyData: { mediaUrl?: string; captionText?: string; backgroundGradient?: string }) => void;
}

const GRADIENTS = [
  'from-pink-500 via-purple-500 to-indigo-500',
  'from-yellow-400 via-pink-500 to-purple-600',
  'from-green-400 to-cyan-500',
  'from-blue-600 to-violet-600',
  'from-orange-500 to-red-600',
  'from-slate-900 to-slate-950 border border-slate-800'
];

export default function StoryViewerOverlay({
  activeStoryIndex,
  stories,
  currentUser,
  onClose,
  onNext,
  onPrev,
  onReplyToStory,
  
  isCreatingStory,
  onCloseCreate,
  onPublishStory
}: StoryViewerOverlayProps) {
  // Viewer states
  const [replyText, setReplyText] = useState('');
  const [progress, setProgress] = useState(0);
  const [replySuccess, setReplySuccess] = useState(false);
  
  // Creation states
  const [customText, setCustomText] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
  const [storyMedia, setStoryMedia] = useState<string>('');
  const [isPhotoStory, setIsPhotoStory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const timerRef = useRef<any>(null);

  const activeStory = activeStoryIndex !== null && stories[activeStoryIndex] ? stories[activeStoryIndex] : null;

  // Progress Bar timer logic (auto skip after 5s)
  useEffect(() => {
    if (activeStoryIndex === null || isCreatingStory) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const intervalTime = 50; // Update progress every 50ms
    const totalDuration = 5000; // 5 seconds
    const steps = totalDuration / intervalTime;
    let currentStep = 0;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      currentStep += 1;
      const nextProgress = (currentStep / steps) * 100;
      
      if (nextProgress >= 100) {
        setProgress(100);
        clearInterval(timerRef.current);
        onNext();
      } else {
        setProgress(nextProgress);
      }
    }, intervalTime);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activeStoryIndex, isCreatingStory]);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeStory) return;

    onReplyToStory(activeStory.userId, `[Replied to your story 🌸] ${replyText.trim()}`);
    setReplyText('');
    setReplySuccess(true);
    setTimeout(() => setReplySuccess(false), 2000);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setStoryMedia(event.target.result as string);
        setIsPhotoStory(true);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim() && !storyMedia) return;

    onPublishStory({
      mediaUrl: isPhotoStory ? storyMedia : undefined,
      captionText: customText.trim() || undefined,
      backgroundGradient: isPhotoStory ? undefined : selectedGradient
    });

    setCustomText('');
    setStoryMedia('');
    setIsPhotoStory(false);
    setPublishSuccess(true);
    setTimeout(() => {
      setPublishSuccess(false);
      onCloseCreate();
    }, 1500);
  };

  // Render Viewer Interface
  if (activeStoryIndex !== null && activeStory) {
    return (
      <div id="sanpython-story-viewer-modal" className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[580px] justify-between relative">
          
          {/* Progress timelines bar */}
          <div className="absolute top-2 left-3 right-3 flex gap-1 z-20">
            {stories.map((s, idx) => (
              <div key={s.id} className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-pink-500 transition-all duration-75"
                  style={{ 
                    width: idx < activeStoryIndex 
                      ? '100%' 
                      : idx === activeStoryIndex 
                        ? `${progress}%` 
                        : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Top Info Header */}
          <div className="p-4 pt-5 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-10">
            <div className="flex items-center gap-2.5 text-left">
              <img src={activeStory.userAvatar} className="w-9 h-9 rounded-full object-cover border border-slate-800" referrerpolicy="no-referrer" />
              <div className="leading-tight">
                <span className="font-bold text-xs text-white uppercase">{activeStory.username}</span>
                <p className="text-[8.5px] text-slate-400 mt-0.5">{new Date(activeStory.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main contents viewport */}
          <div className="flex-1 flex items-center justify-center relative bg-slate-950 overflow-hidden">
            {activeStory.mediaUrl ? (
              // Image Stories
              <div className="w-full h-full relative flex items-center justify-center bg-black">
                <img src={activeStory.mediaUrl} className="w-full h-full object-contain" referrerpolicy="no-referrer" />
                {activeStory.captionText && (
                  <div className="absolute bottom-6 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-slate-800/50 text-center">
                    <p className="text-xs text-white leading-relaxed">{activeStory.captionText}</p>
                  </div>
                )}
              </div>
            ) : (
              // Styled template text gradient story
              <div className={`w-full h-full bg-gradient-to-tr ${activeStory.backgroundGradient || 'from-indigo-600 to-purple-600'} flex items-center justify-center p-8 text-center`}>
                <p className="text-md font-bold text-white leading-relaxed max-w-xs">{activeStory.captionText}</p>
              </div>
            )}

            {/* Navigation Chevron overlays (hidden if single story) */}
            <button 
              onClick={onPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Reply Form Footer block */}
          <div className="p-4 bg-slate-950 border-t border-slate-800">
            {replySuccess ? (
              <div className="py-2.5 text-center text-xs text-emerald-400 font-mono flex items-center justify-center gap-1.5 animate-pulse">
                <Check className="w-4 h-4" /> Message replied to {activeStory.username}!
              </div>
            ) : (
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder={`Reply to ${activeStory.username}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-slate-900 text-xs px-4 py-2.5 rounded-full border border-slate-800 focus:border-indigo-500 outline-none transition-colors font-mono placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    );
  }

  // Render Story Creation Flow
  if (isCreatingStory) {
    return (
      <div id="sanpython-story-creator-modal" className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in select-none">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 relative text-slate-100">
          
          <button 
            onClick={onCloseCreate}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors p-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mb-5 text-left border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" /> Post an Interactive Story
            </h3>
            <p className="text-3xs text-slate-500">Live stories expire after 24 hrs</p>
          </div>

          {publishSuccess ? (
            <div className="bg-emerald-950 border border-emerald-900 p-6 rounded-2xl text-center space-y-2 font-mono">
              <Check className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <p className="text-xs text-white font-bold uppercase tracking-wider">Story Broadcasted!</p>
              <p className="text-[10px] text-emerald-500">Shared with online buddies in real-time!</p>
            </div>
          ) : (
            <form onSubmit={handlePublish} className="space-y-4">
              
              {/* Choice: Text background vs Local Picture */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsPhotoStory(false)}
                  className={`flex-1 py-1.5 rounded-lg text-3xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    !isPhotoStory ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Text Gradient
                </button>
                <button
                  type="button"
                  onClick={() => setIsPhotoStory(true)}
                  className={`flex-1 py-1.5 rounded-lg text-3xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isPhotoStory ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Photo Upload
                </button>
              </div>

              {!isPhotoStory ? (
                /* Text Gradient Mode */
                <div className="space-y-3.5 text-left">
                  <label className="block text-3xs font-bold uppercase tracking-widest text-slate-500 font-mono">Select Color Gradient theme</label>
                  <div className="grid grid-cols-6 gap-2">
                    {GRADIENTS.map((grad, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedGradient(grad)}
                        className={`w-full aspect-square bg-gradient-to-tr ${grad} rounded-lg border-2 transition-all cursor-pointer ${
                          selectedGradient === grad ? 'border-white scale-105' : 'border-slate-800'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Visual Preview sandbox */}
                  <div className={`w-full h-32 bg-gradient-to-tr ${selectedGradient} rounded-2xl flex items-center justify-center p-4 border border-slate-800`}>
                    <p className="text-xs font-bold text-white select-none line-clamp-3">
                      {customText.trim() || "Type details below to preview..."}
                    </p>
                  </div>
                </div>
              ) : (
                /* Photo attachment mode */
                <div className="space-y-3 text-left">
                  <label className="block text-3xs font-bold uppercase tracking-widest text-slate-500 font-mono">Upload Photo Attachment</label>
                  
                  {storyMedia ? (
                    <div className="relative rounded-2xl overflow-hidden border border-indigo-500/20 bg-slate-950 p-1 text-center">
                      <img src={storyMedia} className="max-h-36 mx-auto object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => setStoryMedia('')}
                        className="absolute top-3 right-3 bg-slate-900 text-red-400 text-[8px] font-mono hover:text-white px-2 py-1 rounded cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-800 bg-slate-950/70 p-8 rounded-2xl text-center cursor-pointer relative hover:border-slate-705 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMediaUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
                      ) : (
                        <Image className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                      )}
                      <span className="block text-[10px] text-slate-400 font-bold mt-1">Pick local story snapshot</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-3xs font-bold uppercase tracking-widest text-slate-500 font-mono text-left mb-1.5">Caption detail text</label>
                <input
                  type="text"
                  maxLength={60}
                  required={!isPhotoStory}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder={isPhotoStory ? "Write a photo caption... (optional)" : "Write something inspiring..."}
                  className="w-full bg-slate-950 text-slate-100 text-xs px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCloseCreate}
                  className="flex-1 py-3 border border-slate-800 bg-slate-950/50 hover:bg-slate-900 rounded-xl text-3xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (!storyMedia && !customText.trim())}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-3xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Publish Story
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    );
  }

  return null;
}
