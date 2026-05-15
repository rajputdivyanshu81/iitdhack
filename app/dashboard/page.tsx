'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [songUrl, setSongUrl] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to backend API to add song to queue
    console.log('Adding song:', songUrl);
    setSongUrl('');
  };

  const fetchRecommendations = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Mock history for now
        body: JSON.stringify({
          playHistory: ['Never Gonna Give You Up - Rick Astley'],
          currentQueue: ['Bohemian Rhapsody - Queen']
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

  if (status === 'loading') return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      
      {/* Left Column: Player & Queue */}
      <div className="md:col-span-2 space-y-8">
        <div className="aspect-video bg-neutral-900 rounded-xl border border-neutral-800 flex items-center justify-center">
          <p className="text-neutral-500">YouTube Player Placeholder</p>
        </div>

        <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800">
          <h2 className="text-2xl font-bold mb-4">Current Queue</h2>
          <p className="text-neutral-500 italic">Queue is empty. Add a song to get started!</p>
        </div>
      </div>

      {/* Right Column: Controls & AI */}
      <div className="space-y-8">
        <form onSubmit={handleAddSong} className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 flex flex-col gap-4">
          <h3 className="text-xl font-semibold">Add a Song</h3>
          <input 
            type="text" 
            placeholder="YouTube URL or search..." 
            value={songUrl}
            onChange={(e) => setSongUrl(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded p-3 text-white focus:outline-none focus:border-neutral-600"
          />
          <button type="submit" className="bg-white text-black font-semibold rounded p-3 hover:bg-neutral-200">Add to Queue</button>
        </form>

        <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 flex flex-col gap-4">
          <h3 className="text-xl font-semibold flex items-center justify-between">
            Gemini AI Picks 
            <button onClick={fetchRecommendations} disabled={loadingAi} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">
              {loadingAi ? 'Thinking...' : 'Refresh'}
            </button>
          </h3>
          {recommendations.map((rec, i) => <div key={i} className="text-sm"><p className="font-bold">{rec.title}</p><p className="text-neutral-400">{rec.reason}</p></div>)}
        </div>
      </div>
    </div>
  );
}
