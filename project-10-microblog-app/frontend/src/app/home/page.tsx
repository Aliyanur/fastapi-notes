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
    if (res.ok) fetchPosts();
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

  const [newPost, setNewPost] = useState('');

  return (
    <div>
      <h2>Микроблог</h2>
      <form onSubmit={e => { e.preventDefault(); createPost(newPost); setNewPost(''); }}>
        <input value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Новый пост..." />
        <button type="submit">Опубликовать</button>
      </form>
      <hr />
      <ul>
        {posts.map(p => (
          <li key={p.id}>
            <b onClick={() => router.push(`/users/${p.owner_username}`)} style={{ cursor: 'pointer' }}>{p.owner_username}</b>: {p.text}
            <div>
              ❤️ {p.likes}
              <button onClick={() => likePost(p.id)}>лайк</button>
              <button onClick={() => unlikePost(p.id)}>анлайк</button>
              {user?.id && p.owner_username === user.username && (
                <button onClick={() => deletePost(p.id)}>удалить</button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}