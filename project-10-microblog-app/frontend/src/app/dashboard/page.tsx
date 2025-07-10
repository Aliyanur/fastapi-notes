'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Post {
  id: string;
  text: string;
  timestamp: string;
  owner_username: string;
  likes: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : null;

  async function fetchPosts() {
    const res = await fetch('http://localhost:8000/api/posts');
    const data = await res.json();
    setPosts(data);
  }

  async function createPost(text: string) {
    const res = await fetch('http://localhost:8000/api/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });
    if (res.ok) {
      setNewPost('');
      fetchPosts();
    }
  }

  async function deletePost(id: string) {
    await fetch(`http://localhost:8000/api/posts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchPosts();
  }

  async function likePost(id: string) {
    await fetch(`http://localhost:8000/api/posts/${id}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchPosts();
  }

  async function unlikePost(id: string) {
    await fetch(`http://localhost:8000/api/posts/${id}/like`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchPosts();
  }

  useEffect(() => {
    if (!token) router.push('/login');
    else fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">📝 Микроблог</h1>

        <form onSubmit={(e) => { e.preventDefault(); createPost(newPost); }} className="flex gap-2 mb-6">
          <input
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="flex-1 p-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            placeholder="Поделитесь чем-нибудь..."
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
            Опубликовать
          </button>
        </form>

        <div className="space-y-4">
          {posts.map((p) => (
            <div key={p.id} className="bg-gray-800 p-4 rounded shadow">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold cursor-pointer hover:underline" onClick={() => router.push(`/users/${p.owner_username}`)}>
                  @{p.owner_username}
                </h2>
                <span className="text-sm text-gray-400">{new Date(p.timestamp).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-lg">{p.text}</p>
              <div className="flex items-center gap-2 mt-3">
                <span>❤️ {p.likes}</span>
                <button
                  className="text-sm bg-pink-600 hover:bg-pink-700 px-2 py-1 rounded"
                  onClick={() => likePost(p.id)}>
                  Лайк
                </button>
                <button
                  className="text-sm bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded"
                  onClick={() => unlikePost(p.id)}>
                  Анлайк
                </button>
                {user?.username === p.owner_username && (
                  <button
                    className="text-sm bg-red-600 hover:bg-red-700 px-2 py-1 rounded ml-auto"
                    onClick={() => deletePost(p.id)}>
                    Удалить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
