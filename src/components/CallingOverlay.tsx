import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, Shield, User, Camera, Loader2 } from 'lucide-react';
import { CallState, User as AppUser } from '../types';

interface CallingOverlayProps {
  call: CallState | null;
  onAnswer: () => void;
  onDecline: () => void;
  onEnd: () => void;
  currentUser: AppUser | null;
  activeUsers: AppUser[];
  sendSignal: (type: string, payload: any) => void;
}

export default function CallingOverlay({
  call,
  onAnswer,
  onDecline,
  onEnd,
  currentUser,
  activeUsers,
  sendSignal
}: CallingOverlayProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callingSeconds, setCallingSeconds] = useState(0);
  const [webRTCError, setWebRTCError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<any>(null);

  const isCaller = call?.callerId === currentUser?.id;
  const peer = activeUsers.find(u => u.id === (isCaller ? call?.receiverId : call?.callerId)) || {
    id: 'unknown',
    name: 'Instagram Member',
    email: 'member@instagram.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    isSharingLocation: false,
    lastSeen: Date.now()
  };

  // Start Call Timer
  useEffect(() => {
    if (call?.status === 'connected') {
      setCallingSeconds(0);
      timerRef.current = setInterval(() => {
        setCallingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setCallingSeconds(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [call?.status]);

  // Request Local Media Stream
  useEffect(() => {
    if (call?.status === 'connected' || (isCaller && call?.status === 'calling')) {
      const getMedia = async () => {
        try {
          const config = {
            audio: true,
            video: call?.type === 'video'
          };
          const stream = await navigator.mediaDevices.getUserMedia(config);
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (err: any) {
          console.warn('Could not launch camera / microphone stream:', err);
          setWebRTCError('Camera/Microphone permissions blocked. Running call in simulated visualizer mode.');
        }
      };
      getMedia();
    } else {
      // Clean up stream on unmount or disconnection
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [call?.status, call?.type]);

  // Toggle Track states
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!call) return null;

  return (
    <div id="calling-canvas-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-lg animate-fade-in text-slate-100">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col items-center justify-between shadow-2xl p-6 min-h-[550px]">
        
        {/* Top Status Indicators */}
        <div className="w-full flex justify-between items-center text-slate-400 font-mono text-3xs">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            SECURED END-TO-END CALL
          </span>
          <span className="bg-indigo-950 px-2 py-1 rounded text-indigo-400 uppercase font-bold tracking-wider font-sans">
            {call.type} call
          </span>
        </div>

        {/* Profile Details Container */}
        <div className="flex flex-col items-center text-center space-y-4 my-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping opacity-75"></div>
            <img 
              src={peer.avatar} 
              className="w-24 h-24 rounded-full object-cover border-4 border-slate-800 shadow-xl" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{peer.name}</h2>
            <p className="text-xs text-slate-400 mt-1">{peer.email}</p>
          </div>
          
          <div className="py-2.5">
            {call.status === 'calling' && (
              <p className="text-sm text-indigo-400 font-mono tracking-widest animate-pulse">DIALING PARTNER...</p>
            )}
            {call.status === 'ringing' && (
              <p className="text-sm text-pink-400 font-semibold animate-bounce">RINGING...</p>
            )}
            {call.status === 'connected' && (
              <div className="flex flex-col items-center space-y-1">
                <span className="text-xl font-mono text-white tracking-widest bg-slate-950 px-4 py-1.5 rounded-full border border-slate-800">
                  {formatTime(callingSeconds)}
                </span>
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Active Stream Connected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Camera / Audio Visual Panel */}
        {call.status === 'connected' && (
          <div className="w-full h-44 grid grid-cols-2 gap-3.5 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 overflow-hidden relative">
            
            {/* Local video feed */}
            <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
              {call.type === 'video' && !isCameraOff ? (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500">
                  <Camera className="w-6 h-6 mb-1 opacity-40" />
                  <span className="text-[10px] font-semibold">Camera Off</span>
                </div>
              )}
              <span className="absolute bottom-1.5 left-2 bg-black/60 backdrop-blur text-3xs px-2 py-0.5 rounded text-white font-mono">
                You
              </span>
            </div>

            {/* Remote video feed or Voice viz */}
            <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
              {call.type === 'video' ? (
                <video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-1 shrink-0 p-1">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded animate-bounce [animation-delay:0.1s]"></span>
                    <span className="w-1.5 h-6 bg-indigo-400 rounded animate-bounce [animation-delay:0.3s]"></span>
                    <span className="w-1.5 h-3 bg-indigo-300 rounded animate-bounce [animation-delay:0s]"></span>
                    <span className="w-1.5 h-5 bg-indigo-500 rounded animate-bounce [animation-delay:0.5s]"></span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-semibold font-mono tracking-wider mt-1.5">STREAM VIZ</span>
                </div>
              )}
              {/* Overlay video fallback error msg if permission blocked */}
              {webRTCError && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col justify-center items-center text-center p-2">
                  <div className="flex items-center gap-1.5 text-indigo-400 mb-1">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded animate-bounce [animation-delay:0.1s]"></span>
                    <span className="w-1.5 h-6 bg-indigo-400 rounded animate-bounce [animation-delay:0.3s]"></span>
                    <span className="w-1.5 h-3 bg-indigo-300 rounded animate-bounce [animation-delay:0s]"></span>
                  </div>
                  <p className="text-[8px] text-indigo-300 font-mono leading-normal px-2">Voice & video telemetry active</p>
                </div>
              )}
              <span className="absolute bottom-1.5 left-2 bg-black/60 backdrop-blur text-3xs px-2 py-0.5 rounded text-white font-mono">
                {peer.name}
              </span>
            </div>
            
          </div>
        )}

        {/* Action Controls Panel */}
        <div className="w-full flex justify-center items-center gap-6 mt-6">
          {/* Answer Controls on Receiving Call */}
          {!isCaller && (call.status === 'ringing' || call.status === 'calling') ? (
            <div className="flex items-center gap-10">
              <button
                id="call-decline-incoming"
                onClick={onDecline}
                className="w-14 h-14 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-red-600/30 cursor-pointer"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                id="call-answer"
                onClick={onAnswer}
                className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-emerald-500/30 cursor-pointer"
              >
                <Phone className="w-6 h-6 animate-bounce" />
              </button>
            </div>
          ) : (
            /* Active Call Controls / Caller wait */
            <div className="flex items-center justify-center gap-4 w-full">
              {call.status === 'connected' && (
                <>
                  {/* Mute button */}
                  <button
                    id="call-toggle-mute"
                    onClick={toggleMute}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                      isMuted 
                        ? 'bg-slate-800 border-red-500/50 text-red-400' 
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* Camera on/off button only for video */}
                  {call.type === 'video' && (
                    <button
                      id="call-toggle-camera"
                      onClick={toggleCamera}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                        isCameraOff 
                          ? 'bg-slate-800 border-red-500/50 text-red-400' 
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                    </button>
                  )}
                </>
              )}

              {/* End Call Button */}
              <button
                id="call-decline-regular"
                onClick={onEnd}
                className="w-14 h-14 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-red-600/30 cursor-pointer"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
