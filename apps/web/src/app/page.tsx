'use client';

import { useMutation } from '@apollo/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ANALYZE_REPOSITORY } from '@/lib/graphql/operations';

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [analyzeRepository, { loading, error }] =
    useMutation(ANALYZE_REPOSITORY);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    const { data } = await analyzeRepository({ variables: { url } });
    if (data?.analyzeRepository?.id) {
      router.push(`/tasks/${data.analyzeRepository.id}`);
    }
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Torin</h1>
      <p className="mb-6 text-zinc-400">
        AI-powered code analysis. Enter a Git repository URL to get started.
      </p>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/user/repo"
            required
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-100 px-6 py-2.5 font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error.message}</p>}
      </form>
    </div>
  );
}
