'use client';
import { useEffect, useState } from 'react';

interface Post {
  id: string;
  text: string;
  timestamp: string;
  owner_username: string;
  likes: number;
}

export default function UserPage({ params }: { params: { username: string } }) {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch(`http://localhost:8000/api/users/${params.username}/posts`)
      .then(res => res.json())
      .then(data => setPosts(data));
  }, [params.username]);

  return (
    <div>
      <h2>Посты пользователя: {params.username}</h2>
      <ul>
        {posts.map(p => (
          <li key={p.id}>
            {p.text} <br />
            ❤️ {p.likes}
          </li>
        ))}
      </ul>
    </div>
  );
}