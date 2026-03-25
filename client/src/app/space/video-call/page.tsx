'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  LayoutContextProvider,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, User, Hash, ArrowRight, Loader2, Monitor, Mic, Camera, PhoneOff, Settings2, Search, Zap, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/global/Avatar';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function VideoCallContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [room, setRoom] = useState<string>('');
  const [identity, setIdentity] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [me, setMe] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'manual'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  // Prevent re-join after the user explicitly leaves
  const hasLeft = useRef(false);

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880';
  const supabase = createClient();

  // Load profiles
  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (myProfile) {
        const profile = myProfile as Profile;
        setMe(profile);
        setIdentity(profile.full_name || user.email?.split('@')[0] || 'User');
      }

      const { data: allProfiles } = await supabase.from('profiles').select('*').neq('id', user.id);
      setProfiles((allProfiles as Profile[]) || []);
    };

    loadData();
  }, [supabase]);

  // Handle URL changes to auto-join rooms dynamically (SPA pushes included)
  useEffect(() => {
    const autoRoom = searchParams.get('room');
    // Only auto-join if we have a room param, a profile, no active token,
    // and the user hasn't explicitly left the call.
    if (autoRoom && me && !token && !hasLeft.current) {
      startCall(autoRoom, me.full_name || me.email?.split('@')[0] || 'User');
    }
  }, [searchParams, me, token]);


  const startCall = async (roomName: string, participantIdentity?: string) => {
    setIsLoading(true);
    setError(null);
    const finalIdentity = participantIdentity || identity;

    try {
      const resp = await fetch(`/api/video/token?room=${encodeURIComponent(roomName)}&identity=${encodeURIComponent(finalIdentity)}`);
      
      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Failed to fetch token');
      }

      const { token } = await resp.json();
      setToken(token);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while joining the room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !identity) return;
    startCall(room, identity);
  };

  const handleCallUser = async (otherUser: Profile) => {
    if (!me) return;
    // Consistent room name for two-party call
    const roomName = `call-${[me.id, otherUser.id].sort().join('-')}`;
    
    // Create notification for the other user using the backend to bypass RLS
    try {
      await fetch('/api/video/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_id: otherUser.id,
          sender_id: me.id,
          roomName,
          preview: `${me.full_name || 'Someone'} is calling you...`,
        }),
      });
    } catch (err) {
      console.error('Failed to send call notification:', err);
    }
    
    startCall(roomName);
  };


  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (token) {
    return (
      <div className="h-[calc(100vh-130px)] w-full bg-[#0a0a0a] text-white flex flex-col font-sans rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={serverUrl}
          onDisconnected={() => {
            hasLeft.current = true;   // block the auto-rejoin effect
            setToken(null);
            // Navigate away so the ?room param is gone and there's no re-join
            router.replace('/space/video-call');
          }}
          data-lk-theme="default"
          style={{ height: '100%' }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-140px)] w-full flex flex-col p-4 md:p-8 font-sans selection:bg-[#0a0a0a] selection:text-white">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#E0E0D8] rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#D4D4C8] rounded-full blur-[140px]" />
      </div>

      <div className="max-w-[1000px] mx-auto w-full flex flex-col gap-8 h-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <p className="text-[#9A9A8C] text-sm font-bold uppercase tracking-widest pl-1">Communication Hub</p>
            <h1 className="text-4xl font-black tracking-tight text-[#0a0a0a]">Meetings & Calls</h1>
          </div>
          
          <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-[#E0E0D8] shadow-sm">
            <button 
              onClick={() => setActiveTab('members')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'members' ? 'bg-[#0a0a0a] text-white shadow-lg' : 'text-[#6B6B5F] hover:bg-[#F0F0E8]'}`}
            >
              Team Directory
            </button>
            <button 
              onClick={() => setActiveTab('manual')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'manual' ? 'bg-[#0a0a0a] text-white shadow-lg' : 'text-[#6B6B5F] hover:bg-[#F0F0E8]'}`}
            >
              Manual Join
            </button>
          </div>
        </div>

        {activeTab === 'members' ? (
          <div className="flex flex-col gap-6 flex-1 min-h-0 bg-white/40 backdrop-blur-sm rounded-[32px] border border-white p-6 shadow-sm overflow-hidden">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#9A9A8C] transition-colors group-focus-within:text-[#0a0a0a]" size={20} />
              <input
                type="text"
                placeholder="Search team members by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 pl-16 pr-6 bg-white/80 border border-[#E0E0D8] rounded-2xl outline-none focus:border-[#0a0a0a] focus:ring-1 focus:ring-[#0a0a0a] transition-all text-[#0a0a0a] font-medium placeholder-[#B0B0A0]"
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {filteredProfiles.map((p, idx) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    whileHover={{ y: -4 }}
                    className="p-5 bg-white rounded-3xl border border-[#E0E0D8] shadow-sm flex flex-col items-center text-center gap-4 hover:border-[#0a0a0a] transition-all group"
                  >
                    <div className="relative">
                      <Avatar 
                        url={p.avatar_url} 
                        name={p.full_name} 
                        email={p.email} 
                        size={80} 
                        fallbackColor={idx % 2 === 0 ? "#36C5F0" : "#2EB67D"} 
                      />
                      <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    
                    <div className="space-y-1 flex-1">
                      <h3 className="font-black text-[#0a0a0a] text-lg">{p.full_name || 'Anonymous Member'}</h3>
                      <p className="text-[#9A9A8C] text-sm font-medium">{p.email}</p>
                    </div>

                    <button
                      onClick={() => handleCallUser(p)}
                      disabled={isLoading}
                      className="w-full py-3.5 bg-[#F9F9F7] text-[#0a0a0a] border border-[#E0E0D8] rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 hover:bg-[#0a0a0a] hover:text-white hover:border-[#0a0a0a] group-hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
                    >
                      <Video size={16} />
                      Start Call
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {filteredProfiles.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-40">
                <Search size={48} />
                <p className="font-black text-[#0a0a0a]">No team members found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-[480px] bg-white rounded-[40px] border border-[#E0E0D8] p-10 shadow-xl"
            >
              <div className="flex flex-col gap-8">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-[#0a0a0a] rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-black/10">
                    <Hash size={24} />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-[#0a0a0a]">One-off Meeting</h2>
                  <p className="text-[#6B6B5F] font-medium leading-relaxed">Enter a custom room identifier to join an ad-hoc session.</p>
                </div>

                <form onSubmit={handleManualJoin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#0a0a0a] uppercase tracking-[0.2em] pl-1">Room ID</label>
                    <div className="relative group">
                      <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9A9A8C] transition-colors group-focus-within:text-[#0a0a0a]" size={18} />
                      <input
                        type="text"
                        placeholder="e.g. brainstorming-v2"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-[#F9F9F7] border border-[#E0E0D8] rounded-2xl outline-none focus:border-[#0a0a0a] focus:ring-1 focus:ring-[#0a0a0a] transition-all text-[#0a0a0a] font-black"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-[#FFF1F1] border border-[#FFD9D9] text-[#E03131] p-4 rounded-2xl text-xs font-bold flex items-start gap-2"
                    >
                      <p>{error}</p>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-16 bg-[#0a0a0a] hover:bg-[#1a1a1a] disabled:bg-[#9A9A8C] text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg shadow-black/20"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <span>Join Live Session</span>
                        <Zap size={20} className="fill-white" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        <div className="flex items-center justify-between py-6 border-t border-[#E0E0D8]">
          <div className="flex items-center gap-6 text-[#9A9A8C] text-[10px] font-black uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Mic size={14} /> Encrypted Audio</span>
            <span className="flex items-center gap-1.5"><Camera size={14} /> Full HD Video</span>
          </div>
          <p className="text-[#9A9A8C] text-[10px] font-black uppercase tracking-widest">Powered by LiveKit Edge</p>
        </div>
      </div>
    </div>
  );
}

export default function VideoCallPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8 bg-[#0a0a0a] text-white">Loading interface...</div>}>
      <VideoCallContent />
    </Suspense>
  );
}

