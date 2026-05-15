'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import YouTube from 'react-youtube';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [songUrl, setSongUrl] = useState('');
  const [queue, setQueue] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState(false);

  const fetchQueue = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`/api/streams?creatorId=${session.user.id}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setQueue(data.streams || []);
    } catch (error) {
      // Quietly log polling errors to avoid UI noise
      console.warn('Queue sync paused - retrying...');
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchQueue();
      const interval = setInterval(fetchQueue, 5000);
      return () => clearInterval(interval);
    }
  }, [status, session?.user?.id, router]);

  const handleUpvote = async (streamId: string) => {
    try {
      await fetch('/api/streams/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId })
      });
      fetchQueue();
    } catch (error) {
      console.error('Error upvoting:', error);
    }
  };

  const handleDownvote = async (streamId: string) => {
    try {
      await fetch('/api/streams/downvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ streamId })
      });
      fetchQueue();
    } catch (error) {
      console.error('Error downvoting:', error);
    }
  };
  const fetchRecommendations = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playHistory: queue.slice(0, 5).map(s => s.title),
          currentQueue: queue.map(s => s.title)
        })
      });
      const data = await res.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
    setLoadingAi(false);
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songUrl) return;

    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: songUrl, creatorId: session?.user?.id })
      });
      
      if (res.ok) {
        setSongUrl('');
        fetchQueue();
      }
    } catch (error) {
      console.error('Error adding song:', error);
    }
  };

  const copyShareLink = () => {
    if (!session?.user?.id) return;
    const link = `${window.location.origin}/creator/${session.user.id}`;
    navigator.clipboard.writeText(link);
    alert('Room link copied to clipboard!');
  };

  const playNext = async () => {
    if (queue.length > 0) {
      const currentSong = queue[0];
      try {
        await fetch('/api/streams/played', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streamId: currentSong.id })
        });
        fetchQueue();
      } catch (error) {
        console.error('Error progressing queue:', error);
      }
    }
  };

  if (status === 'loading') return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;

  const currentVideo = queue[0];

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 flex flex-col gap-8 max-w-7xl mx-auto">
      
      {/* Header with Share */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-900/40 p-6 rounded-3xl border border-neutral-800">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Your Room
          </h1>
          <p className="text-neutral-500 text-sm">Host your sync and invite friends.</p>
        </div>
        <button 
          onClick={copyShareLink}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <span>Share Room Link</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Player & Queue */}
        <div className="md:col-span-2 space-y-8">
          <div className="aspect-video bg-neutral-900 rounded-3xl border border-neutral-800 flex items-center justify-center overflow-hidden shadow-2xl relative group">
            {currentVideo ? (
              <YouTube
                videoId={currentVideo.extractedId}
                opts={{
                  width: '100%',
                  height: '100%',
                  playerVars: {
                    autoplay: 1,
                    controls: 1,
                  },
                }}
                onEnd={playNext}
                className="w-full h-full"
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <p className="text-neutral-500 font-medium animate-pulse relative z-10">Waiting for songs to be added...</p>
              </div>
            )}
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-md p-8 rounded-3xl border border-neutral-800 shadow-xl">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              Upcoming Queue
            </h2>
            
            <div className="space-y-4">
              {queue.length === 0 ? (
                <div className="text-center py-20 bg-neutral-950/30 rounded-2xl border border-dashed border-neutral-800">
                  <p className="text-neutral-500 italic">Queue is currently empty.</p>
                </div>
              ) : (
                queue.map((item) => (
                  <div key={item.id} className="flex items-center gap-5 bg-neutral-900/80 p-4 rounded-2xl border border-neutral-800 hover:border-neutral-600 transition-all group">
                    <img src={item.smallImg} alt="" className="w-28 h-16 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate text-neutral-100">{item.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${item.score >= 0 ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}>
                          {item.score} {Math.abs(item.score) === 1 ? 'vote' : 'votes'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUpvote(item.id)}
                        className="bg-neutral-800 hover:bg-blue-600 p-3 rounded-xl transition-all active:scale-90 hover:shadow-lg hover:shadow-blue-600/20 group/btn"
                        title="Upvote"
                      >
                        <span className="text-lg group-hover/btn:scale-125 transition-transform inline-block">👍</span>
                      </button>
                      <button 
                        onClick={() => handleDownvote(item.id)}
                        className="bg-neutral-800 hover:bg-red-600 p-3 rounded-xl transition-all active:scale-90 hover:shadow-lg hover:shadow-red-600/20 group/btn"
                        title="Downvote"
                      >
                        <span className="text-lg group-hover/btn:scale-125 transition-transform inline-block">👎</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Controls & AI */}
        <div className="space-y-8">
          <form onSubmit={handleAddSong} className="bg-neutral-900 p-8 rounded-3xl border border-neutral-800 shadow-xl flex flex-col gap-6 sticky top-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Add to Queue</h3>
              <p className="text-xs text-neutral-500">Supports YouTube links and search.</p>
            </div>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="https://youtube.com/watch?v=..." 
                value={songUrl}
                onChange={(e) => setSongUrl(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-neutral-700"
              />
            </div>
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl p-5 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
              ADD SONG
            </button>
          </form>

          <div className="bg-neutral-900/50 backdrop-blur-md p-8 rounded-3xl border border-neutral-800 shadow-xl flex flex-col gap-6">
            <h3 className="text-xl font-bold flex items-center justify-between">
              Gemini Picks 
              <button onClick={fetchRecommendations} disabled={loadingAi} className="text-[10px] uppercase tracking-wider bg-neutral-800 hover:bg-neutral-700 text-neutral-400 px-4 py-2 rounded-xl font-black transition-colors border border-neutral-700">
                {loadingAi ? '✨ Processing' : '✨ Refresh'}
              </button>
            </h3>
            <div className="space-y-4">
              {recommendations.length === 0 ? (
                <p className="text-xs text-neutral-500 leading-relaxed italic">No suggestions yet. Add songs for better AI picks!</p>
              ) : (
                recommendations.map((rec, i) => (
                  <div key={i} className="text-sm p-4 bg-neutral-950/50 rounded-2xl border border-neutral-800/50 hover:bg-neutral-900 transition-all cursor-pointer group">
                    <p className="font-bold text-neutral-300 group-hover:text-blue-400 transition-colors">{rec.title}</p>
                    <p className="text-[10px] text-neutral-500 mt-1.5 line-clamp-2 leading-relaxed opacity-60">{rec.reason}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
