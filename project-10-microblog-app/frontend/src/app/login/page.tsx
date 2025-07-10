'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('user1');
  const [password, setPassword] = useState('password1');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } else {
      setError('Неверный логин или пароль');
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <h2>Вход</h2>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="password" type="password" />
      <button type="submit">Войти</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}