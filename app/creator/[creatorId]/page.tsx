'use client';

import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CreatorPage() {
  const { creatorId } = useParams();
  const { data: session } = useSession();
  
  const [songUrl, setSongUrl] = useState('');
  const [queue, setQueue] = useState<any[]>([]);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`/api/streams?creatorId=${creatorId}`);
      const data = await res.json();
      setQueue(data.streams || []);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, [creatorId]);

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songUrl) return;

    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: songUrl, creatorId }) // We need to update API to accept targeted creatorId
      });
      
      if (res.ok) {
        setSongUrl('');
        fetchQueue();
      }
    } catch (error) {
      console.error('Error adding song:', error);
    }
  };

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

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-8">
        <div className="aspect-video bg-neutral-900 rounded-2xl border border-neutral-800 flex items-center justify-center">
          <p className="text-neutral-500 font-medium">Watching the Live Sync...</p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-2xl border border-neutral-800 shadow-xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
            Room Queue
          </h2>
          
          <div className="space-y-4">
            {queue.map((item) => (
              <div key={item.id} className="flex items-center gap-4 bg-neutral-900 p-3 rounded-xl border border-neutral-800 transition-all group">
                <img src={item.smallImg} alt="" className="w-24 h-14 object-cover rounded-lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{item.title}</p>
                  <p className="text-xs text-neutral-500">Score: {item.score}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleUpvote(item.id)}
                    className="bg-neutral-800 hover:bg-blue-600 p-2 rounded-lg transition-all active:scale-90"
                    title="Upvote"
                  >
                    👍
                  </button>
                  <button 
                    onClick={() => handleDownvote(item.id)}
                    className="bg-neutral-800 hover:bg-red-600 p-2 rounded-lg transition-all active:scale-90"
                    title="Downvote"
                  >
                    👎
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 shadow-xl flex flex-col gap-4">
          <h3 className="text-xl font-bold">Add to this Room</h3>
          <form onSubmit={handleAddSong} className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="YouTube URL..." 
              value={songUrl}
              onChange={(e) => setSongUrl(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
            />
            <button type="submit" className="bg-blue-600 text-white font-bold rounded-xl p-4 hover:bg-blue-500 transition-all">
              Submit Song
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
