'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
  TrackReference,
  VideoTrack,
  useLocalParticipant,
  useChat,
  useRoomContext,
  useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, User, Hash, Loader2, Camera, Search, Zap,
  MessageCircle, Share2, MicOff, CameraOff,
  ScreenShare, ClosedCaption, Send, Mic,
  MonitorUp, Pin, PinOff, UserPlus, Check, X, Maximize2, Minimize2,
  Calendar, Plus, PhoneCall, PhoneMissed, PhoneOutgoing, PhoneIncoming,
  PictureInPicture2, Settings, MoreVertical, LayoutGrid, Monitor, LogOut, Layout,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/global/Avatar';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePresence } from '@/hooks/use-presence';
import { Suspense } from 'react';
import { Track } from 'livekit-client';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

/* ── Helpers ── */
function getInitials(name?: string | null, email?: string | null) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (email) return email[0].toUpperCase();
  return 'U';
}
const AVATAR_COLORS = ['#4F8EF7', '#2EB67D', '#E01E5A', '#ECB22E', '#36C5F0', '#7B5EA7'];
function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* ── Avatar Placeholder (camera off) ── */
function AvatarPlaceholder({ name, email, avatarUrl, size = 80 }: {
  name?: string | null; email?: string | null; avatarUrl?: string | null; size?: number;
}) {
  const bg = avatarColor(name || email || 'user');
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name || ''} className="rounded-full object-cover shadow-md"
          style={{ width: size, height: size }} />
      ) : (
        <div className="rounded-full flex items-center justify-center font-black text-white shadow-md"
          style={{ width: size, height: size, background: bg, fontSize: size * 0.36 }}>
          {getInitials(name, email)}
        </div>
      )}
    </div>
  );
}

/* ── Control button - Minimalist ── */
function ControlBtn({ icon, onClick, className }: {
  icon: React.ReactNode; onClick?: () => void; className?: string;
}) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={className || "w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer transition-all border-0 shadow-md bg-[#0D0D0D] text-white hover:bg-black shadow-sm active:scale-95"}>
      {icon}
    </button>
  );
}

/* ── Chat message type ── */
interface ChatMessage {
  id: string; sender: string; text: string; time: string; isMe?: boolean; avatarUrl?: string | null;
}

/* ── Custom Video Conference ── */
function CustomVideoConference({ me, profiles, isPipActive, onTogglePip, activeRoom }: { me: Profile | null, profiles: Profile[], isPipActive?: boolean, onTogglePip?: () => void, activeRoom: string }) {
  const [pinnedTrackSid, setPinnedTrackSid] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'presenter'>('grid');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [videoFit, setVideoFit] = useState<'cover' | 'contain'>('contain');
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const participants = useParticipants();

  const screenShareTrack = tracks.find(t => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter(t => t.source === Track.Source.Camera);

  useEffect(() => {
    if (screenShareTrack) {
      setLayoutMode('presenter');
      setIsFocusMode(true);
    } else {
      setLayoutMode('grid');
    }
  }, [screenShareTrack]);

  const focusTrack = (pinnedTrackSid ? tracks.find(t => t.participant.sid === pinnedTrackSid && t.source === Track.Source.Camera) : null)
    || screenShareTrack
    || (cameraTracks.length > 0 ? cameraTracks[0] : null);

  const thumbnailTracks = cameraTracks.filter(t => t.participant.sid !== focusTrack?.participant.sid);

  const isCameraOn = (track: typeof cameraTracks[0]) =>
    !!(track.publication && !track.publication.isMuted && track.publication.track);

  const getDisplayName = (identity: string) =>
    identity === localParticipant.identity ? (me?.full_name || 'You') : identity;

  return (
    <div className={`flex-1 flex flex-col min-h-0 relative ${isPipActive ? 'gap-0 bg-black' : 'gap-0 bg-[#F9F9F7]'}`}>
      {/* Background radial glow - Soft and light */}
      {!isPipActive && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[20%] w-[60%] h-[60%] bg-[#36C5F0]/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-[20%] right-[20%] w-[60%] h-[60%] bg-[#2EB67D]/10 rounded-full blur-[140px]" />
        </div>
      )}

      {/* Focus Area - Maximized */}
      <div className={`flex-1 overflow-hidden relative transition-all duration-700 
        ${isPipActive ? 'rounded-0' : (isFocusMode ? 'p-0' : 'p-4')}`}>
        <div
          onClick={() => isFocusMode && setIsFocusMode(false)}
          className={`h-full w-full bg-white/40 backdrop-blur-3xl overflow-hidden relative group/focus transition-all duration-700 cursor-pointer
          ${isFocusMode ? 'rounded-0' : 'rounded-[40px] shadow-[0_24px_80px_rgba(0,0,0,0.06)] border border-black/5 ring-1 ring-black/5'}`}>
          {focusTrack && isCameraOn(focusTrack) ? (
            <div className="w-full h-full relative cursor-default">
              <VideoTrack
                trackRef={focusTrack as TrackReference}
                className={`w-full h-full focus-video-el ${focusTrack.source === Track.Source.ScreenShare ? 'object-contain' : videoFit}`}
              />
              {screenShareTrack && (
                <div className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 bg-[#E01E5A] rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-xl animate-pulse z-10">
                  <Monitor size={14} /> Live Sharing
                </div>
              )}
            </div>
          ) : (
            <AvatarPlaceholder
              name={focusTrack?.participant.identity === localParticipant.identity ? (me?.full_name || me?.email) : focusTrack?.participant.identity}
              email={focusTrack?.participant.identity === localParticipant.identity ? me?.email : null}
              avatarUrl={focusTrack?.participant.identity === localParticipant.identity ? me?.avatar_url : null}
              size={120}
            />
          )}

          <div className={`absolute left-8 bottom-8 flex items-center gap-3 z-10 transition-all duration-500
            ${isPipActive ? 'scale-75 origin-left' : ''} ${isFocusMode ? 'opacity-0 group-hover/focus:opacity-100' : ''}`}>
            <div className="px-5 py-2.5 bg-white/90 backdrop-blur-md rounded-[20px] text-[#0D0D0D] font-black text-[12px] tracking-tight flex items-center gap-2 border border-black/5 shadow-xl">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2EB67D] animate-pulse" />
              {focusTrack ? getDisplayName(focusTrack.participant.identity) : 'Participant'}
              {focusTrack?.participant.identity === localParticipant.identity && <span className="opacity-40 font-bold ml-1">(You)</span>}
            </div>
            {!isPipActive && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onTogglePip?.(); }}
                className="w-11 h-11 bg-white/80 hover:bg-white backdrop-blur-md text-[#0D0D0D] rounded-2xl flex items-center justify-center transition-all border border-black/5 shadow-lg"
                title="Picture in Picture"
              >
                <PictureInPicture2 size={20} />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Control bar - Grouped Bottom - Overlaid for Max Height */}
      <div className={`flex-shrink-0 flex items-center justify-between pointer-events-none absolute bottom-0 left-0 right-0 z-30 transition-all duration-700
        ${isPipActive ? 'bg-gradient-to-t from-black/20 to-transparent px-4 pb-2 pt-8' : 'bg-gradient-to-t from-[#F9F9F7]/80 via-[#F9F9F7]/20 to-transparent px-10 pb-4 pt-16'}
        ${isFocusMode ? 'opacity-0 group-hover/focus:opacity-100' : 'opacity-100'}`}>

        {/* Participants count - Left - Light styling */}
        {!isPipActive && (
          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="px-6 py-3.5 bg-white/90 backdrop-blur-md rounded-[24px] border border-black/5 flex items-center gap-4 shadow-xl">
              <div className="flex -space-x-3">
                {participants.slice(0, 4).map((p, idx) => {
                  const profile = profiles.find(pr => (pr.full_name || pr.email) === p.identity) || (p.identity === localParticipant.identity ? me : null);
                  return (
                    <div key={p.sid} className="w-8 h-8 rounded-full border-2 border-white shadow-lg overflow-hidden group/p shrink-0 relative hover:z-50 transition-all" style={{ zIndex: 30 - idx }}>
                      <Avatar url={profile?.avatar_url} name={profile?.full_name || p.identity} email={profile?.email} size={32} />
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-black/30 tracking-widest uppercase leading-none mb-0.5">Live Now</span>
                <span className="text-[12px] font-black text-[#0D0D0D] tracking-tight">{participants.length} Active Participants</span>
              </div>
            </div>
          </div>
        )}

        {/* Center Controls - Light translucency */}
        <div className={`flex items-center gap-2 bg-white/95 backdrop-blur-3xl rounded-[24px] border border-black/5 shadow-xl pointer-events-auto transition-all
          ${isPipActive ? 'mx-auto px-2.5 py-1 scale-90' : 'px-5 py-2'}`}>
          <ControlBtn
            icon={localParticipant.isMicrophoneEnabled ? <Mic size={isPipActive ? 14 : 16} className="text-white" /> : <MicOff size={isPipActive ? 14 : 16} className="text-white" />}
            onClick={() => localParticipant.setMicrophoneEnabled(!localParticipant.isMicrophoneEnabled)}
            className={`${isPipActive ? 'w-7 h-7' : 'w-9 h-9'} rounded-[12px] flex items-center justify-center transition-all cursor-pointer border-0 ${!localParticipant.isMicrophoneEnabled ? 'bg-[#FF4A50] text-white shadow-lg' : 'bg-[#0D0D0D] text-white hover:bg-black shadow-md'}`}
          />
          <ControlBtn
            icon={localParticipant.isCameraEnabled ? <Video size={isPipActive ? 14 : 16} className="text-white" /> : <CameraOff size={isPipActive ? 14 : 16} className="text-white" />}
            onClick={() => localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled)}
            className={`${isPipActive ? 'w-7 h-7' : 'w-9 h-9'} rounded-[12px] flex items-center justify-center transition-all cursor-pointer border-0 ${!localParticipant.isCameraEnabled ? 'bg-[#FF4A50] text-white shadow-lg' : 'bg-[#0D0D0D] text-white hover:bg-black shadow-md'}`}
          />

          <div className="w-px h-4 bg-black/5 mx-0.5" />

          <ControlBtn
            icon={<MonitorUp size={isPipActive ? 14 : 16} className="text-white" />}
            onClick={() => localParticipant.setScreenShareEnabled(!localParticipant.isScreenShareEnabled)}
            className={`${isPipActive ? 'w-7 h-7' : 'w-9 h-9'} rounded-[12px] flex items-center justify-center transition-all cursor-pointer border-0 ${localParticipant.isScreenShareEnabled ? 'bg-[#36C5F0] border-transparent text-white shadow-lg' : 'bg-[#0D0D0D] text-white hover:bg-black shadow-md'}`}
          />

          <ControlBtn
            icon={isFocusMode ? <Maximize2 size={isPipActive ? 14 : 16} className="text-white" /> : <LayoutGrid size={isPipActive ? 14 : 16} className="text-white" />}
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`${isPipActive ? 'w-7 h-7' : 'w-9 h-9'} rounded-[12px] flex items-center justify-center transition-all cursor-pointer border-0 ${isFocusMode ? 'bg-[#36C5F0] border-transparent text-white shadow-lg' : 'bg-[#0D0D0D] text-white hover:bg-black shadow-md'}`}
          />

          {!isPipActive && (
            <ControlBtn
              icon={videoFit === 'cover' ? <Maximize2 size={16} className="text-[#0D0D0D]" /> : <Minimize2 size={16} className="text-[#0D0D0D]" />}
              onClick={() => setVideoFit(videoFit === 'cover' ? 'contain' : 'cover')}
              className="w-9 h-9 rounded-[12px] flex items-center justify-center transition-all cursor-pointer border-0 bg-transparent text-[#0D0D0D] hover:bg-black/5 border-transparent"
            />
          )}

          {!isPipActive && <ControlBtn icon={<Settings size={16} className="text-[#0D0D0D]" />} className="w-9 h-9 rounded-[12px] flex items-center justify-center transition-all cursor-pointer border-0 bg-transparent text-[#0D0D0D] hover:bg-black/5 border-transparent" />}
        </div>

        {/* Action Button - Right */}
        {!isPipActive && (
          <div className="flex items-center gap-3 pointer-events-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                if (participants.length <= 1) {
                  await fetch('/api/video/end', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room_name: activeRoom, status: 'ended' }) });
                }
                room.disconnect();
              }}
              className="px-6 py-2.5 bg-[#E01E5A] hover:bg-[#E01E5A]/90 text-white rounded-[16px] text-[12px] font-black transition-all shadow-[0_8px_20px_rgba(224,30,90,0.15)] active:scale-95 flex items-center gap-2"
            >
              <LogOut size={14} />
              Leave
            </motion.button>
          </div>
        )}
      </div>

      {/* Thumbnails Floating - Refined stage - Compact Light mode */}
      {!isPipActive && !isFocusMode && thumbnailTracks.length > 0 && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col gap-6 max-h-[70%] overflow-y-auto pr-3 scrollbar-hide z-20 transition-all duration-700">
          {thumbnailTracks.map(track => {
            const isPinned = pinnedTrackSid === track.participant.sid;
            return (
              <motion.div key={track.participant.sid}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`w-48 aspect-video rounded-[28px] overflow-hidden relative flex-shrink-0 bg-white shadow-2xl group transition-all duration-300
                  ${isPinned ? 'ring-4 ring-[#36C5F0] scale-105' : 'ring-1 ring-black/5 hover:ring-black/10'}`}>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPinnedTrackSid(isPinned ? null : track.participant.sid);
                  }}
                  className={`absolute top-3 left-3 z-20 w-9 h-9 rounded-2xl flex items-center justify-center transition-all 
                  ${isPinned
                      ? 'bg-[#36C5F0] text-white shadow-lg'
                      : 'bg-white/90 text-[#0D0D0D] opacity-0 group-hover:opacity-100 backdrop-blur-md shadow-xl'
                    }`}
                >
                  {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                </button>

                {isCameraOn(track) ? (
                  <VideoTrack trackRef={track as TrackReference} className="w-full h-full object-cover" />
                ) : (
                  <AvatarPlaceholder name={track.participant.identity} size={64} />
                )}
                <div className="absolute bottom-4 left-4 px-4 py-1.5 bg-white/95 backdrop-blur-md rounded-2xl text-[#0D0D0D] text-[11px] font-black tracking-tight shadow-lg border border-black/5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2EB67D]" />
                    {getDisplayName(track.participant.identity)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Local Hardware Preview Component (Teams Lobby Style) ── */
function HardwarePreview({ enabled, type }: { enabled: boolean; type: 'video' | 'audio' }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (enabled && type === 'video') {
      navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
        activeStream = s;
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      }).catch(console.error);
    } else {
      setStream(null);
    }
    return () => {
      activeStream?.getTracks().forEach(t => t.stop());
    };
  }, [enabled, type]);

  if (!enabled) return null;
  return <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain transform scale-x-[-1]" />;
}

/* ── In-call view ── */
function InCallView({ token, serverUrl, activeRoom, me, profiles, onLeave }: {
  token: string; serverUrl: string; activeRoom: string; me: Profile | null; profiles: Profile[]; onLeave: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [preJoinComplete, setPreJoinComplete] = useState(false);
  const [previewCam, setPreviewCam] = useState(true);
  const [previewMic, setPreviewMic] = useState(true);
  const [isPipActive, setIsPipActive] = useState(false);

  // Real-time Presence for Lobby
  const presence = usePresence(`video-lobby-${activeRoom}`, me?.id || '', { status: 'lobby', name: me?.full_name }, true);
  const onlineParticipants = Object.values(presence).flat().filter((p: any) => p.userId !== me?.id);
  const activeParticipants = profiles.filter(p => onlineParticipants.some((op: any) => op.userId === p.id));

  const inCallContainerRef = useRef<HTMLDivElement>(null);
  const pipWindowRef = useRef<Window | null>(null);

  const toggleDocumentPip = async () => {
    if (!('documentPictureInPicture' in window)) {
      // Fallback for non-Chromium browsers - standard PiP on video element if possible
      const videoEl = document.querySelector('.focus-video-el video') as HTMLVideoElement;
      if (videoEl && document.pictureInPictureEnabled) {
        if (document.pictureInPictureElement) document.exitPictureInPicture();
        else videoEl.requestPictureInPicture().catch(console.error);
      } else {
        alert("Picture-in-Picture is not supported in this browser.");
      }
      return;
    }

    if (isPipActive && pipWindowRef.current) {
      pipWindowRef.current.close();
      return;
    }

    try {
      // @ts-ignore
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 800,
        height: 450,
      });

      // Style synchronization
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          pipWindow.document.head.appendChild(style);
        } catch (e) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = styleSheet.type;
          link.media = styleSheet.media.mediaText;
          link.href = styleSheet.href!;
          pipWindow.document.head.appendChild(link);
        }
      });

      // Simple workaround to fix fonts and tailwind class colors which might use variables
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
      pipWindow.document.head.appendChild(fontLink);

      // Important: Add a black background to PiP window body and ensure it takes full space
      pipWindow.document.body.style.background = '#F9F9F7';
      pipWindow.document.body.style.margin = '0';
      pipWindow.document.body.style.overflow = 'hidden';
      pipWindow.document.body.style.height = '100vh';
      pipWindow.document.body.style.width = '100vw';
      pipWindow.document.body.style.display = 'flex';

      pipWindowRef.current = pipWindow;
      setIsPipActive(true);

      // Handle PiP close
      pipWindow.addEventListener('pagehide', () => {
        setIsPipActive(false);
        pipWindowRef.current = null;
      });

    } catch (e) {
      console.error("Failed to enter Document PiP:", e);
    }
  };

  // Automatic PiP Effect - Visibility Change (Tab Switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !isPipActive) {
        toggleDocumentPip();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPipActive]);

  const lobbyContent = (
    <div className="h-full w-full flex flex-col bg-[#F9F9F7] text-sans overflow-hidden relative">
      {/* Lobby Topbar - Premium Glassmorphism */}
      {!isPipActive && (
        <div className="w-full px-8 py-5 flex items-center justify-between absolute top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/40 border-b border-black/5 transition-all">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 group cursor-default">
              <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500">
                <Layout size={18} className="text-white fill-[#36C5F0] group-hover:rotate-12 transition-transform" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-[#0D0D0D] tracking-tight leading-none mb-0.5">nudge sync</span>
                <span className="text-[10px] font-bold text-black/30 tracking-widest uppercase">Video Hub</span>
              </div>
            </div>
            <div className="h-8 w-px bg-black/5 mx-2" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-[#36C5F0] animate-pulse shadow-[0_0_8px_rgba(54,197,240,0.5)]" />
              <span className="text-[10px] font-black text-black/50 uppercase tracking-[0.15em] shrink-0">Live Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="px-5 py-2 bg-white/60 backdrop-blur-md rounded-2xl border border-black/5 shadow-sm flex items-center gap-3 group hover:border-[#36C5F0]/20 transition-all cursor-default">
              <div className="text-right">
                <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.15em] leading-none mb-0.5">Ready to join as</p>
                <p className="text-[13px] font-black text-[#0D0D0D] tracking-tight leading-none">{me?.full_name || 'Visitor'}</p>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-white shadow-md overflow-hidden ring-1 ring-black/5">
                <Avatar url={me?.avatar_url} name={me?.full_name} email={me?.email} size={32} />
              </div>
            </div>
            <button onClick={onLeave} className="w-10 h-10 rounded-xl bg-white/40 hover:bg-[#FF4A50] hover:text-white text-black/40 flex items-center justify-center transition-all border border-black/5 hover:border-[#FF4A50] shadow-sm active:scale-95 group">
              <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-4">
        {/* Animated background - Soft and airy */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#36C5F0]/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#2EB67D]/10 rounded-full blur-[140px]" />
        </div>

        <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Video Preview */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full aspect-video bg-white/60 backdrop-blur-3xl rounded-[40px] border border-black/5 shadow-[0_32px_80px_rgba(0,0,0,0.06)] overflow-hidden relative group ring-1 ring-black/5">
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.02) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                {!previewCam ? (
                  <div className={`flex flex-col items-center ${isPipActive ? 'gap-3' : 'gap-6'}`}>
                    <div className={`${isPipActive ? 'w-24 h-24 ring-4' : 'w-40 h-40 ring-8'} rounded-full bg-white ring-black/5 flex items-center justify-center shadow-2xl transition-all`}>
                      <Avatar url={me?.avatar_url} name={me?.full_name} email={me?.email} size={isPipActive ? 80 : 130} />
                    </div>
                    {!isPipActive && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full border border-black/5">
                        <CameraOff size={16} className="text-black/40" />
                        <span className="text-xs font-black text-black/40 uppercase tracking-widest">Camera is off</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <HardwarePreview enabled={previewCam} type="video" />
                )}
              </div>
            </div>

            {/* Controlled Row Below Video */}
            <div className={`${isPipActive ? 'mt-4 px-5 py-1.5 rounded-2xl scale-90' : 'mt-6 px-6 py-2.5 rounded-[24px]'} flex items-center gap-2.5 bg-white border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] z-20 transition-all`}>
              <button onClick={() => setPreviewMic(!previewMic)}
                className={`${isPipActive ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center transition-all cursor-pointer ${!previewMic ? 'bg-[#FF4A50] text-white shadow-lg' : 'bg-[#0D0D0D] text-white hover:bg-black shadow-md'}`}
                title={previewMic ? 'Mute Microphone' : 'Unmute Microphone'}>
                {!previewMic ? <MicOff size={isPipActive ? 14 : 18} className="text-white" /> : <Mic size={isPipActive ? 14 : 18} className="text-white" />}
              </button>
              <div className="w-px h-6 bg-black/5 mx-0.5" />
              <button onClick={() => setPreviewCam(!previewCam)}
                className={`${isPipActive ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center transition-all cursor-pointer ${!previewCam ? 'bg-[#FF4A50] text-white shadow-lg' : 'bg-[#0D0D0D] text-white hover:bg-black shadow-md'}`}
                title={previewCam ? 'Turn Camera Off' : 'Turn Camera On'}>
                {!previewCam ? <CameraOff size={isPipActive ? 14 : 18} className="text-white" /> : <Camera size={isPipActive ? 14 : 18} className="text-white" />}
              </button>
              {!isPipActive && (
                <>
                  <div className="w-px h-6 bg-black/5 mx-0.5" />
                  <button onClick={toggleDocumentPip}
                    className="w-10 h-10 rounded-xl bg-white border border-black/5 text-[#0D0D0D] hover:bg-black/5 flex items-center justify-center transition-all shadow-sm"
                    title="Picture in Picture">
                    <PictureInPicture2 size={18} />
                  </button>
                  <div className="w-px h-6 bg-black/5 mx-0.5" />
                  <button className="w-10 h-10 rounded-xl bg-white border border-black/5 text-[#0D0D0D] hover:bg-black/5 flex items-center justify-center transition-all shadow-sm" title="Device Settings">
                    <Settings size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Right: Join Actions */}
          <div className={`${isPipActive ? 'lg:col-span-12 mt-4 space-y-4' : 'lg:col-span-5 space-y-10'} flex flex-col justify-center transition-all`}>
            <div className={`${isPipActive ? 'space-y-2' : 'space-y-5'}`}>
              {!isPipActive && (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-[#36C5F0]/10 rounded-full border border-[#36C5F0]/20">
                  <div className="w-2 h-2 rounded-full bg-[#36C5F0] animate-pulse" />
                  <span className="text-[11px] font-black text-[#36C5F0] uppercase tracking-widest">Live Lobby</span>
                </div>
              )}
              <h2 className={`${isPipActive ? 'text-2xl' : 'text-6xl'} font-black text-[#0D0D0D] tracking-tighter leading-[0.9] transition-all`}>
                {activeRoom.startsWith('project-') ? 'Project Sync' : 'Direct Meeting'}
              </h2>
              {!isPipActive && <p className="text-black/50 text-xl font-medium leading-relaxed max-w-sm">Experience crystal clear video and seamless collaboration. Your team is waiting.</p>}
            </div>

            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPreJoinComplete(true)}
                className={`${isPipActive ? 'h-12 rounded-xl' : 'h-16 rounded-[20px]'} group relative w-full bg-[#0D0D0D] hover:bg-black overflow-hidden shadow-[0_12px_24px_rgba(0,0,0,0.1)] flex items-center justify-center cursor-pointer transition-all`}
              >
                <span className={`${isPipActive ? 'text-xs' : 'text-lg'} relative z-10 text-white font-black tracking-tight`}>Join Now</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const inCallContent = (
    <LiveKitRoom
      video={previewCam}
      audio={previewMic}
      token={token}
      serverUrl={serverUrl}
      onDisconnected={onLeave}
      data-lk-theme="default"
      className="flex-1 flex overflow-hidden relative"
      style={{ background: 'transparent' }}
    >
      <InCallContent activeRoom={activeRoom} me={me} profiles={profiles} isPipActive={isPipActive} onTogglePip={toggleDocumentPip} />

      <div className="absolute top-2 right-4 z-50 flex gap-2">
        {!isPipActive && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 rounded-xl bg-white/80 backdrop-blur border border-[#EBEBEB] shadow-sm flex items-center justify-center text-[#0D0D0D] hover:bg-white transition-all active:scale-95 group"
            title={isExpanded ? "Collapse View" : "Expand to Fullscreen"}
          >
            {isExpanded ? <Minimize2 size={12} className="group-hover:scale-110 transition-transform" /> : <Maximize2 size={16} className="group-hover:scale-110 transition-transform" />}
          </button>
        )}
      </div>
    </LiveKitRoom>
  );

  const mainContent = preJoinComplete ? inCallContent : lobbyContent;

  const pipPlaceholder = (
    <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50/50 p-8 text-center space-y-6">
      <div className="w-24 h-24 rounded-[32px] bg-white border border-gray-100 flex items-center justify-center shadow-sm relative">
        <div className="absolute inset-0 bg-[#36C5F0]/10 rounded-[32px] animate-pulse" />
        <PictureInPicture2 size={40} className="text-[#36C5F0] relative z-10" />
      </div>
      <div>
        <h3 className="text-xl font-black text-gray-900 tracking-tight">Meeting in Picture-in-Picture</h3>
        <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto font-medium">Your meeting is continuing in a separate floating window. You can keep browsing other tabs.</p>
      </div>
      <button
        onClick={() => pipWindowRef.current?.close()}
        className="px-8 py-3.5 bg-[#0D0D0D] hover:bg-black text-white text-sm font-black rounded-2xl transition-all shadow-md active:scale-95 flex items-center gap-2 group"
      >
        <Maximize2 size={16} className="group-hover:scale-110 transition-transform" />
        Bring it back here
      </button>
    </div>
  );

  return (
    <div className={`${isExpanded ? 'fixed inset-0 z-[100] h-screen w-screen p-4 md:p-8 bg-[#F9F9F7]' : 'h-[calc(100vh-130px)]'} w-full transition-all duration-300`}>
      <div className="h-full w-full flex rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-[#EBEBEB] bg-white font-sans relative" id="in-call-host">
        {isPipActive && pipWindowRef.current
          ? (
            <>
              {pipPlaceholder}
              {createPortal(mainContent, pipWindowRef.current.document.body)}
            </>
          )
          : mainContent
        }
      </div>
    </div>
  );
}

function InCallContent({ activeRoom, me, profiles, isPipActive, onTogglePip }: { activeRoom: string, me: Profile | null, profiles: Profile[], isPipActive?: boolean, onTogglePip?: () => void }) {
  const { send, chatMessages } = useChat();
  const { localParticipant } = useLocalParticipant();
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const [displayTitle, setDisplayTitle] = useState<string>(activeRoom);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  // Track in-call presence
  usePresence(`video-lobby-${activeRoom}`, me?.id || '', { status: 'in-call', name: me?.full_name }, true);

  const [invitedUserIds, setInvitedUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchMetadata = async () => {
      // Parse Room Type & IDs
      const uuids = activeRoom.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);

      if (activeRoom.startsWith('project-') && uuids?.[0]) {
        const projectId = uuids[0];
        const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single();
        if (project?.name) setDisplayTitle(`Project: ${project.name}`);

        // Fetch project members for invite
        const { data: members } = await supabase
          .from('project_members')
          .select(`
            profiles!project_members_user_id_fkey(id, full_name, email, avatar_url)
          `)
          .eq('project_id', projectId);

        if (members) {
          setProjectMembers(members.map((m: any) => m.profiles).filter(Boolean));
        }
      } else if (activeRoom.startsWith('call-') && uuids && uuids.length >= 2) {
        const { data } = await supabase.from('profiles').select('full_name').in('id', uuids.slice(0, 2));
        if (data && data.length > 0) {
          const names = data.map(p => p.full_name || 'User');
          setDisplayTitle(`Call: ${names.join(' & ')}`);
        }
      }
    };
    fetchMetadata();
  }, [activeRoom, supabase]);

  // Handle Speech Recognition & Live Sync
  useEffect(() => {
    if (!me || !activeRoom) return;

    // @ts-ignore
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return; // Browser doesn't support it

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = false;
    let isRunning = true;

    recognition.onresult = async (event: any) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        const text = result[0].transcript.trim();
        if (text) {
          try {
            await fetch('/api/video/transcript', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                room_name: activeRoom,
                user_id: me.id,
                content: `${me.full_name || 'User'}: ${text}`,
                content_type: 'speech'
              }),
            });
          } catch (e) { }
        }
      }
    };

    recognition.onend = () => {
      if (isRunning) {
        // Restart gracefully unless component unmounted
        try { recognition.start(); } catch (e) { }
      }
    };

    try { recognition.start(); } catch (e) { }

    return () => {
      isRunning = false;
      try { recognition.stop(); } catch (e) { }
    };
  }, [me, activeRoom]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: 9999, behavior: 'smooth' });
    }
  }, [chatMessages]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const sendMessage = async () => {
    if (!chatInput.trim() || !send) return;
    try {
      const msg = chatInput.trim();
      await send(msg);
      setChatInput('');

      // Also log to our transcripts table
      if (me && activeRoom) {
        fetch('/api/video/transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_name: activeRoom,
            user_id: me.id,
            content: `${me.full_name || 'User'}: ${msg}`,
            content_type: 'chat'
          }),
        }).catch(e => console.error('Failed to log chat transcript:', e));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Main video area */}
      <div className={`flex-1 flex flex-col min-w-0 ${isPipActive ? 'bg-black' : 'bg-white'}`}>
        {/* Header - Hidden in PiP */}
        {!isPipActive && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F5F5F2] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50/50 flex items-center justify-center border border-blue-100/50">
                <Video size={20} className="text-[#36C5F0]" />
              </div>
              <div>
                <h2 className="text-[#0D0D0D] font-black text-[17px] tracking-tight leading-tight">{displayTitle}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[#B0B0A8] text-[11px] font-medium">
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-[#E01E5A] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E01E5A] animate-pulse" />
                    Live Meeting
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsInviteOpen(true)}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#36C5F0] text-white hover:bg-[#2ba9d4] transition-all shadow-lg shadow-blue-100 active:scale-95 group"
                title="Add People"
              >
                <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all border active:scale-95 shadow-sm group
                   ${isChatOpen ? 'bg-black text-[#36C5F0] border-black' : 'bg-white text-[#0D0D0D] border-black/5 hover:bg-gray-50'}`}
                title={isChatOpen ? 'Close Chat' : 'Messages'}
              >
                <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={copyLink}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white text-[#0D0D0D] border border-black/5 hover:bg-gray-50 transition-all shadow-sm active:scale-95 group"
                title="Copy Meeting Link"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Share2 size={18} className="group-hover:scale-110 transition-transform" />}
              </button>
            </div>
          </div>
        )}

        {/* Invite Modal Overlay */}
        {/* Invite Modal Overlay - Only in main view */}
        {!isPipActive && (
          <AnimatePresence>
            {isInviteOpen && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsInviteOpen(false)}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                />
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="relative bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.15)] border border-[#EBEBEB]">
                  <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-gray-900 font-bold text-[18px]">Invite People</h3>
                    <button onClick={() => setIsInviteOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto min-h-[200px]">
                    {(projectMembers.length > 0 ? projectMembers : profiles).length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-gray-400 text-[12px] font-medium uppercase tracking-wider mb-2">
                          {projectMembers.length > 0 ? 'Project Members' : 'Suggested People'}
                        </p>
                        {(projectMembers.length > 0 ? projectMembers : profiles).slice(0, 10).map((member) => (
                          <div key={member.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden ring-1 ring-gray-100 bg-gray-50">
                                {member.avatar_url ? (
                                  <img src={member.avatar_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-blue-500 font-bold bg-blue-50">
                                    {getInitials(member.full_name)}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[14px] font-bold text-gray-800">{member.full_name || 'Team Member'}</span>
                                <span className="text-[11px] text-gray-400 truncate max-w-[150px]">{member.email}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setInvitedUserIds(prev => new Set(prev).add(member.id));
                                setTimeout(() => {
                                  setInvitedUserIds(prev => {
                                    const next = new Set(prev);
                                    next.delete(member.id);
                                    return next;
                                  });
                                }, 2000);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors border
                              ${invitedUserIds.has(member.id)
                                  ? 'bg-green-50 text-green-600 border-green-100'
                                  : 'bg-gray-50 text-blue-500 opacity-0 group-hover:opacity-100 border-gray-100 hover:bg-blue-50'
                                }`}
                            >
                              {invitedUserIds.has(member.id) ? 'Sent' : 'Invite'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                          <UserPlus size={24} className="text-gray-300" />
                        </div>
                        <p className="text-gray-800 font-bold text-[15px]">Invite via link</p>
                        <p className="text-gray-400 text-[12px] max-w-[200px] mt-1">Copy and send the meeting link to anyone you want to join.</p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-gray-50/50 border-t border-gray-50">
                    <button
                      onClick={copyLink}
                      className="w-full h-12 rounded-2xl bg-white border border-gray-200 text-blue-500 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-sm active:scale-[0.98]"
                    >
                      {copied ? <Check size={18} className="text-green-500" /> : <Share2 size={16} />}
                      {copied ? 'Link Copied!' : 'Copy Meeting Link'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        )}

        {/* Video */}
        <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${isPipActive ? 'p-0 bg-black' : 'gap-3 p-4 bg-white'}`}>
          <CustomVideoConference me={me} profiles={profiles} isPipActive={isPipActive} onTogglePip={onTogglePip} activeRoom={activeRoom} />
        </div>
        <RoomAudioRenderer />
      </div>

      {/* Chat sidebar - Only in main view */}
      {!isPipActive && (
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0 bg-blue-50/20 border-l border-gray-100 flex flex-col overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-900 font-bold text-[15px]">Messages</h3>
                  <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </div>
                <p className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">
                  You can chat here with other members during the meeting and they will be deleted after the meeting.
                </p>
              </div>

              <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                {chatMessages.map((msg, idx) => {
                  const isMe = msg.from?.identity === localParticipant?.identity;
                  const senderName = msg.from?.identity || 'Member';
                  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={`${msg.timestamp}-${idx}`} className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden ring-1 ring-gray-100 shadow-sm"
                        style={{ background: avatarColor(senderName) }}>
                        {isMe && me?.avatar_url
                          ? <img src={me.avatar_url} className="w-full h-full object-cover" alt="" />
                          : <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-black">{getInitials(senderName)}</div>
                        }
                      </div>
                      <div className={`flex flex-col gap-0.5 max-w-[80%] ${isMe ? 'items-end' : ''}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold ${isMe ? 'text-blue-500' : 'text-gray-500'}`}>
                            {isMe ? 'You' : senderName}
                          </span>
                          <span className="text-gray-300 text-[10px]">{time}</span>
                        </div>
                        <div className={`${msg.from?.sid === localParticipant?.sid
                          ? "bg-[#36C5F0] text-white"
                          : "bg-[#F5F5F2] text-[#0D0D0D]"
                          } rounded-2xl p-3 max-w-[85%] shadow-sm`}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 rounded-2xl bg-[#F5F5F2] flex items-center justify-center mb-3 text-[#C8C8C0]">
                      <MessageCircle size={24} />
                    </div>
                    <p className="text-[10px] font-black text-[#B0B0A8] uppercase tracking-[0.15em]">No messages yet</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 h-11 focus-within:border-blue-300 focus-within:bg-white transition-all">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-500 text-[11px] font-black">S</span>
                  </div>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Write a message..."
                    className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-[12px] font-medium"
                  />
                  <button
                    onClick={sendMessage}
                    className="w-7 h-7 bg-blue-500 rounded-xl flex items-center justify-center hover:bg-blue-600 transition-colors flex-shrink-0 shadow-sm"
                  >
                    <Send size={12} className="text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}


/* ── Meetings Hub types ── */
interface CallLog {
  id: string;
  room_name: string;
  type: 'direct' | 'project';
  project_id: string | null;
  initiator_id: string | null;
  recipient_id: string | null;
  status: 'ringing' | 'ongoing' | 'ended' | 'missed';
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

function formatDuration(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const secs = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function formatScheduled(iso: string) {
  return new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function callCountdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Starting soon';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `In ${mins}m`;
  return `In ${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/* ── Lobby view / Meetings Hub ── */
function LobbyView({ me, profiles, onJoin, onCallUser, isLoading, error }: {
  me: Profile | null; profiles: Profile[];
  onJoin: (room: string, identity: string) => void;
  onCallUser: (p: Profile) => void;
  isLoading: boolean; error: string | null;
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<'overview' | 'team' | 'history'>('overview');
  const [room, setRoom] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({});
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedTitle, setSchedTitle] = useState('');
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedProjectId, setSchedProjectId] = useState('');
  const [schedLoading, setSchedLoading] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const identity = me?.full_name || me?.email?.split('@')[0] || 'User';
  const filteredProfiles = profiles.filter(p =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Resolve human-readable names for all call logs
  useEffect(() => {
    if (callLogs.length === 0) return;
    const resolve = async () => {
      const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
      // Collect all UUIDs needed
      const profileIds = new Set<string>();
      const projectIds = new Set<string>();
      for (const cl of callLogs) {
        const uuids = cl.room_name.match(UUID_RE) ?? [];
        if (cl.room_name.startsWith('project-') && uuids[0]) projectIds.add(uuids[0]);
        else if (cl.room_name.startsWith('call-') && uuids.length >= 2) {
          uuids.slice(0, 2).forEach(id => profileIds.add(id));
        }
      }
      // Batch fetch profiles
      const profileMap: Record<string, string> = {};
      if (profileIds.size > 0) {
        const { data } = await supabase.from('profiles').select('id,full_name').in('id', [...profileIds]);
        data?.forEach((p: any) => { profileMap[p.id] = p.full_name || 'User'; });
      }
      // Batch fetch projects
      const projectMap: Record<string, string> = {};
      if (projectIds.size > 0) {
        const { data } = await supabase.from('projects').select('id,name').in('id', [...projectIds]);
        data?.forEach((p: any) => { projectMap[p.id] = p.name; });
      }
      // Build resolved map
      const names: Record<string, string> = {};
      for (const cl of callLogs) {
        const uuids = cl.room_name.match(UUID_RE) ?? [];
        if (cl.room_name.startsWith('project-') && uuids[0] && projectMap[uuids[0]]) {
          names[cl.room_name] = projectMap[uuids[0]];
        } else if (cl.room_name.startsWith('call-') && uuids.length >= 2) {
          const participants = uuids.slice(0, 2).map(id => profileMap[id] || 'User');
          names[cl.room_name] = participants.join(' & ');
        } else {
          names[cl.room_name] = cl.room_name;
        }
      }
      setResolvedNames(names);
    };
    resolve();
  }, [callLogs]);

  // Auto-cleanup stagnant calls (ringing for >5mins with no scheduled_at)
  useEffect(() => {
    if (callLogs.length === 0) return;
    const cleanup = async () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      const stagnant = callLogs.filter(c =>
        c.status === 'ringing' &&
        !c.scheduled_at &&
        new Date(c.created_at) < fiveMinsAgo
      );

      for (const call of stagnant) {
        try {
          // Optimistically update local state to prevent multiple calls
          setCallLogs(prev => prev.map(cl => cl.id === call.id ? { ...cl, status: 'missed' } : cl));
          await fetch('/api/video/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ call_log_id: call.id, status: 'missed' }),
          });
        } catch (e) {
          console.error('Failed to cleanup call:', call.id, e);
        }
      }
    };

    // Check every 30s
    const interval = setInterval(cleanup, 30000);
    cleanup(); // and run once immediately

    return () => clearInterval(interval);
  }, [callLogs]);

  // Load call logs + projects
  useEffect(() => {
    if (!me?.id) return;
    const load = async () => {
      // Fetch user's projects for project calls
      const { data: userProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', me.id);

      const projectIds = userProjects?.map(p => p.project_id) || [];

      // Fetch call logs (direct calls involving user OR project calls for user's projects)
      let query = supabase
        .from('call_logs')
        .select('*');

      if (projectIds.length > 0) {
        query = query.or(`initiator_id.eq.${me.id},recipient_id.eq.${me.id},project_id.in.(${projectIds.join(',')})`);
      } else {
        query = query.or(`initiator_id.eq.${me.id},recipient_id.eq.${me.id}`);
      }

      const { data } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) setCallLogs(data as CallLog[]);

      // Also load projects list for the Schedule dropdown
      const { data: projs } = await supabase.from('projects').select('id,name').limit(20);
      if (projs) setProjects(projs);
    };
    load();

    // Realtime subscription for call_logs changes
    const sub = supabase.channel('call_logs_lobby')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_logs' }, (p) => {
        if (p.eventType === 'INSERT') {
          setCallLogs(prev => [p.new as CallLog, ...prev]);
        } else if (p.eventType === 'UPDATE') {
          setCallLogs(prev => prev.map(c => c.id === (p.new as CallLog).id ? p.new as CallLog : c));
        }
      }).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [me?.id]);

  const handleSchedule = async () => {
    if (!me || !schedDate || !schedTime) return;
    setSchedLoading(true);
    const scheduled_at = new Date(`${schedDate}T${schedTime}`).toISOString();
    const room_name = schedProjectId
      ? `project-${schedProjectId}`
      : `scheduled-${me.id}-${Date.now()}`;
    await fetch('/api/video/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id: me.id, project_id: schedProjectId || null, room_name, scheduled_at, title: schedTitle }),
    });
    setSchedLoading(false);
    setShowSchedule(false);
    setSchedTitle(''); setSchedDate(''); setSchedTime(''); setSchedProjectId('');
  };

  const ongoing = callLogs.filter(c => c.status === 'ongoing' || (c.status === 'ringing' && !c.scheduled_at));
  const scheduled = callLogs.filter(c => c.status === 'ringing' && c.scheduled_at && new Date(c.scheduled_at) > new Date(Date.now() - 60000));
  const history = callLogs.filter(c => c.status === 'ended' || c.status === 'missed');
  const missed = history.filter(c => c.status === 'missed');

  const TABS = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'team' as const, label: 'Team' },
    { id: 'history' as const, label: `History${missed.length > 0 ? ` · ${missed.length} missed` : ''}` },
  ];

  return (
    <div className="relative h-[calc(100vh-140px)] w-full flex flex-col p-4 md:p-8 bg-[#F9F9F7]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#36C5F0]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#2EB67D]/5 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-6 h-full min-h-0">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#36C5F0] text-[10px] font-black uppercase tracking-[0.2em]">
              <div className="w-2 h-2 rounded-full bg-[#36C5F0]" />Video hub
            </div>
            <h1 className="text-3xl font-black tracking-tight text-[#0D0D0D]">Meetings & Calls</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowSchedule(true)}
              className="h-10 px-4 rounded-xl bg-white border border-[#EBEBEB] shadow-sm text-[#0D0D0D] font-bold text-xs flex items-center gap-2 hover:bg-gray-50 transition-all active:scale-95">
              <Calendar size={14} className="text-[#36C5F0]" /> Schedule
            </button>
            <form onSubmit={e => { e.preventDefault(); onJoin(room, identity); }}
              className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-[#EBEBEB] shadow-sm">
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#B0B0A8]" size={15} />
                <input type="text" placeholder="Join by ID..." value={room} onChange={e => setRoom(e.target.value)}
                  className="w-40 h-10 pl-10 pr-4 bg-[#F9F9F7] border-0 rounded-xl outline-none focus:ring-1 focus:ring-[#36C5F0]/30 transition-all text-sm font-bold text-[#0D0D0D] placeholder-[#B0B0A8]" />
              </div>
              <button type="submit" disabled={isLoading || !room}
                className="h-10 px-5 bg-[#0D0D0D] hover:bg-black disabled:bg-[#EBEBEB] text-white rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-sm active:scale-95">
                {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} className="fill-[#36C5F0] text-[#36C5F0]" />}
                Join
              </button>
            </form>
          </div>
        </div>

        {error && <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[13px] font-bold shadow-sm flex-shrink-0">{error}</div>}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white rounded-2xl border border-[#EBEBEB] p-1 shadow-sm flex-shrink-0 w-fit">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2 rounded-xl text-[12px] font-black transition-all ${tab === t.id ? 'bg-[#0D0D0D] text-white shadow-sm' : 'text-[#B0B0A8] hover:text-[#0D0D0D]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            {tab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-6">
                {/* Ongoing */}
                <section>
                  <p className="text-[10px] font-black text-[#B0B0A8] uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Live Now · {ongoing.length}
                  </p>
                  {ongoing.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#EBEBEB] p-6 text-center">
                      <p className="text-[#B0B0A8] text-sm">No active meetings right now.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ongoing.map(cl => (
                        <motion.div key={cl.id} className="bg-white rounded-2xl border-2 border-emerald-200 p-4 flex items-center gap-4 shadow-sm shadow-emerald-50">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <Video size={18} className="text-emerald-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-[#0D0D0D] text-sm truncate">{resolvedNames[cl.room_name] ?? cl.room_name}</p>
                            <p className="text-[#B0B0A8] text-xs">Live · started {formatRelative(cl.started_at ?? cl.created_at)}</p>
                          </div>
                          <button onClick={() => onJoin(cl.room_name, identity)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs transition-all active:scale-95 shadow-sm shadow-emerald-100">
                            Join
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Scheduled */}
                <section>
                  <p className="text-[10px] font-black text-[#B0B0A8] uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                    <Calendar size={10} className="text-[#B0B0A8]" />
                    Scheduled · {scheduled.length}
                  </p>
                  {scheduled.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#EBEBEB] p-5 flex items-center justify-between gap-4">
                      <p className="text-[#B0B0A8] text-sm">No upcoming meetings.</p>
                      <button onClick={() => setShowSchedule(true)}
                        className="px-4 py-2 bg-[#F9F9F7] border border-[#EBEBEB] text-[#0D0D0D] rounded-xl font-bold text-xs hover:bg-white transition-all flex items-center gap-2 active:scale-95">
                        <Plus size={13} /> Schedule one
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {scheduled.map(cl => (
                        <div key={cl.id} className="bg-white rounded-2xl border border-[#EBEBEB] p-4 flex items-center gap-4 shadow-sm">
                          <div className="w-10 h-10 rounded-xl bg-[#F5F5F2] flex items-center justify-center flex-shrink-0">
                            <Calendar size={16} className="text-[#36C5F0]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-[#0D0D0D] text-sm truncate">{resolvedNames[cl.room_name] ?? cl.room_name}</p>
                            <p className="text-[#B0B0A8] text-xs">{cl.scheduled_at ? formatScheduled(cl.scheduled_at) : 'Soon'}</p>
                          </div>
                          <span className="text-[11px] font-bold text-[#36C5F0] bg-[#36C5F0]/10 px-3 py-1 rounded-full flex-shrink-0">
                            {cl.scheduled_at ? callCountdown(cl.scheduled_at) : ''}
                          </span>
                          {cl.status === 'ongoing' ? (
                            <button onClick={() => onJoin(cl.room_name, identity)}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs transition-all active:scale-95 flex-shrink-0">
                              Join Now
                            </button>
                          ) : cl.initiator_id === me?.id ? (
                            <button onClick={() => onJoin(cl.room_name, identity)}
                              className="px-4 py-2 bg-[#0D0D0D] hover:bg-black text-white rounded-xl font-black text-xs transition-all active:scale-95 flex-shrink-0">
                              Start Meeting
                            </button>
                          ) : (
                            <div className="px-4 py-2 bg-[#F9F9F7] text-[#B0B0A8] rounded-xl font-bold text-xs flex-shrink-0 border border-[#EBEBEB]">
                              Waiting...
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </motion.div>
            )}

            {tab === 'team' && (
              <motion.div key="team" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex flex-col gap-4">
                <div className="bg-white rounded-[24px] border border-[#EBEBEB] p-6 shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B0B0A8]" size={16} />
                      <input type="text" placeholder="Search team members..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full h-11 pl-12 pr-4 bg-[#F9F9F7] border border-transparent rounded-[16px] outline-none focus:border-[#EBEBEB] transition-all text-sm font-semibold text-[#0D0D0D] placeholder-[#B0B0A8]" />
                    </div>
                    <span className="text-[10px] font-black text-[#B0B0A8] uppercase tracking-widest bg-[#F9F9F7] px-3 py-1.5 rounded-xl border border-[#F5F5F2]">
                      {filteredProfiles.length} members
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <AnimatePresence mode="popLayout">
                      {filteredProfiles.map((p, idx) => (
                        <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="group flex items-center gap-4 p-3 hover:bg-[#F9F9F7] rounded-2xl transition-all">
                          <div className="relative flex-shrink-0">
                            <Avatar url={p.avatar_url} name={p.full_name} email={p.email} size={44}
                              fallbackColor={idx % 2 === 0 ? '#4F8EF7' : '#2EB67D'} />
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm truncate">{p.full_name || 'Anonymous'}</h3>
                            <p className="text-gray-400 text-xs font-medium truncate">{p.email}</p>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onCallUser(p)} disabled={isLoading}
                              className="flex items-center gap-2 h-9 px-4 bg-[#36C5F0] text-white rounded-xl font-bold text-xs hover:bg-[#2ba9d4] transition-all disabled:opacity-50 active:scale-95">
                              <Video size={14} /> Call
                            </button>
                            <button className="flex items-center justify-center w-9 h-9 bg-white text-gray-400 border border-[#EBEBEB] rounded-xl hover:text-gray-900 hover:border-gray-300 transition-all">
                              <MessageCircle size={14} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {filteredProfiles.length === 0 && (
                      <div className="py-20 flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#F9F9F7] border border-[#EBEBEB] flex items-center justify-center mb-3 text-[#C8C8C0]"><Search size={28} /></div>
                        <p className="font-black text-[#0D0D0D] text-sm">No team members found</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="bg-white rounded-[24px] border border-[#EBEBEB] overflow-hidden shadow-sm">
                  {history.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#F9F9F7] border border-[#EBEBEB] flex items-center justify-center mb-3 text-[#C8C8C0]">
                        <PhoneCall size={26} />
                      </div>
                      <p className="font-black text-[#0D0D0D] text-sm">No call history yet</p>
                      <p className="text-[#B0B0A8] text-xs mt-1">Your past calls will appear here.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#F5F5F2]">
                      {history.map((cl, i) => {
                        const isMissed = cl.status === 'missed';
                        const isMe = cl.initiator_id === me?.id;
                        const duration = formatDuration(cl.started_at, cl.ended_at);
                        return (
                          <motion.div key={cl.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                            className="flex items-center gap-4 px-6 py-4 hover:bg-[#F9F9F7] transition-colors group">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isMissed ? 'bg-red-50' : 'bg-[#F9F9F7]'}`}>
                              {isMissed
                                ? <PhoneMissed size={16} className="text-red-400" />
                                : isMe
                                  ? <PhoneOutgoing size={16} className="text-[#36C5F0]" />
                                  : <PhoneIncoming size={16} className="text-[#2EB67D]" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[#0D0D0D] text-sm truncate">{resolvedNames[cl.room_name] ?? cl.room_name}</p>
                              <p className={`text-xs font-medium ${isMissed ? 'text-red-400' : 'text-[#B0B0A8]'}`}>
                                {isMissed ? 'Missed · ' : ''}{formatRelative(cl.created_at)}
                                {duration && ` · ${duration}`}
                              </p>
                            </div>
                            <button onClick={() => onJoin(cl.room_name, identity)}
                              className="opacity-0 group-hover:opacity-100 px-3 py-1.5 rounded-xl bg-[#F9F9F7] border border-[#EBEBEB] text-[#0D0D0D] font-bold text-xs hover:bg-white transition-all flex items-center gap-1.5">
                              <PhoneCall size={12} /> Call back
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showSchedule && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSchedule(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-[32px] w-full max-w-md p-8 shadow-[0_24px_80px_rgba(0,0,0,0.15)] border border-[#EBEBEB]">
              <button onClick={() => setShowSchedule(false)} className="absolute top-5 right-5 w-9 h-9 rounded-full hover:bg-[#F5F5F2] flex items-center justify-center text-[#B0B0A8] transition-colors">
                <X size={18} />
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#36C5F0]/10 flex items-center justify-center">
                  <Calendar size={20} className="text-[#36C5F0]" />
                </div>
                <div>
                  <h3 className="font-black text-[#0D0D0D] text-lg">Schedule Meeting</h3>
                  <p className="text-[#B0B0A8] text-xs">Auto-notify your team in chat</p>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-black text-[#B0B0A8] uppercase tracking-wider block mb-1.5">Title (optional)</label>
                  <input type="text" placeholder="Weekly sync, Design review…" value={schedTitle} onChange={e => setSchedTitle(e.target.value)}
                    className="w-full h-11 px-4 bg-[#F9F9F7] border border-[#EBEBEB] rounded-2xl text-sm font-semibold text-[#0D0D0D] outline-none focus:ring-2 focus:ring-[#36C5F0]/20 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black text-[#B0B0A8] uppercase tracking-wider block mb-1.5">Date</label>
                    <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                      className="w-full h-11 px-4 bg-[#F9F9F7] border border-[#EBEBEB] rounded-2xl text-sm font-semibold text-[#0D0D0D] outline-none focus:ring-2 focus:ring-[#36C5F0]/20 transition-all" />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-[#B0B0A8] uppercase tracking-wider block mb-1.5">Time</label>
                    <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
                      className="w-full h-11 px-4 bg-[#F9F9F7] border border-[#EBEBEB] rounded-2xl text-sm font-semibold text-[#0D0D0D] outline-none focus:ring-2 focus:ring-[#36C5F0]/20 transition-all" />
                  </div>
                </div>
                {projects.length > 0 && (
                  <div>
                    <label className="text-[11px] font-black text-[#B0B0A8] uppercase tracking-wider block mb-1.5">Project (optional)</label>
                    <select value={schedProjectId} onChange={e => setSchedProjectId(e.target.value)}
                      className="w-full h-11 px-4 bg-[#F9F9F7] border border-[#EBEBEB] rounded-2xl text-sm font-semibold text-[#0D0D0D] outline-none focus:ring-2 focus:ring-[#36C5F0]/20 transition-all">
                      <option value="">Personal / No project</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
                <button onClick={handleSchedule} disabled={schedLoading || !schedDate || !schedTime}
                  className="w-full h-12 bg-[#0D0D0D] hover:bg-black text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:bg-[#EBEBEB] disabled:text-[#B0B0A8] mt-2">
                  {schedLoading ? <Loader2 size={16} className="animate-spin" /> : <Calendar size={16} />}
                  Schedule Meeting
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main page ── */
function VideoCallContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [room, setRoom] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [me, setMe] = useState<Profile | null>(null);
  const hasLeft = useRef(false);
  const isJoining = useRef(false);
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (myProfile) setMe(myProfile as Profile);
      const { data: allProfiles } = await supabase.from('profiles').select('*').neq('id', user.id);
      setProfiles((allProfiles as Profile[]) || []);
    };
    loadData();
  }, [supabase]);

  useEffect(() => {
    const autoRoom = searchParams.get('room');
    if (autoRoom && me && !token && !hasLeft.current && !isJoining.current) {
      isJoining.current = true;
      startCall(autoRoom, me.full_name || me.email?.split('@')[0] || 'User');
    }
  }, [searchParams, me, token]);

  const startCall = async (roomName: string, participantIdentity?: string, metadata: { recipient_id?: string; project_id?: string; preview?: string } = {}) => {
    setIsLoading(true);
    setError(null);
    const id = participantIdentity || me?.full_name || 'User';
    try {
      const resp = await fetch(`/api/video/token?room=${encodeURIComponent(roomName)}&identity=${encodeURIComponent(id)}`);
      if (!resp.ok) throw new Error((await resp.json()).error || 'Failed to fetch token');
      const { token: t } = await resp.json();

      // Notify backend that we are starting/joining this room
      // This triggers the "Meeting Started" message for project calls
      await fetch('/api/video/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: me?.id,
          roomName,
          project_id: metadata.project_id || (roomName.startsWith('project-') ? roomName.replace('project-', '') : null),
          recipient_id: metadata.recipient_id,
          preview: metadata.preview
        }),
      });

      setToken(t); setRoom(roomName);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally { setIsLoading(false); }
  };

  const handleCallUser = async (otherUser: Profile) => {
    if (!me) return;
    const roomName = `call-${[me.id, otherUser.id].sort().join('-')}`;
    startCall(roomName, undefined, {
      recipient_id: otherUser.id,
      preview: `${me.full_name || 'Someone'} is calling you...`
    });

    // We don't have the callLogId easily anymore without extra logic, 
    // but the backend handles ringing -> missed if unanswered (handled by stagnant cleanup in Lobby)
  };

  const handleProjectCall = async (projectId: string, roomName: string) => {
    if (!me) return;
    startCall(roomName, undefined, { project_id: projectId });
  };

  if (token) {
    return (
      <InCallView token={token} serverUrl={serverUrl}
        activeRoom={searchParams.get('room') || room || 'Meeting'} me={me} profiles={profiles}
        onLeave={async () => {
          hasLeft.current = true;
          setToken(null);
          router.replace('/space/video-call');
        }} />
    );
  }

  return (
    <LobbyView me={me} profiles={profiles}
      onJoin={(r, id) => startCall(r, id)} onCallUser={handleCallUser}
      isLoading={isLoading} error={error} />
  );
}

export default function VideoCallPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8 bg-white text-gray-500 font-sans">Loading…</div>}>
      <VideoCallContent />
    </Suspense>
  );
}