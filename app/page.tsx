'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-6">
        <h1 className="text-6xl font-bold tracking-tighter">StreamSync V2</h1>
        <p className="text-xl text-neutral-400">Collaborative music queues powered by Gemini AI</p>
        <button 
          onClick={() => signIn('google')}
          className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-neutral-200 transition-colors">
          Sign In to Continue
        </button>
      </div>
    </main>
  );
}
