'use client';
import { useState, FormEvent } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_URL = 'http://localhost:8000/api';

export default function LoginPage() {
  const [username, setUsername] = useState('user');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const response = await axios.post(`${API_URL}/login`, params);

      // Сохраняем токен в localStorage
      localStorage.setItem('auth_token', response.data.access_token);

      // Перенаправляем на защищенную страницу
      router.push('/dashboard');
    } catch (err) {
      setError('Неверный логин или пароль.');
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Вход</h1>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block mb-1">Имя пользователя</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <div className="mb-6">
          <label className="block mb-1">Пароль</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded" />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Войти
        </button>
      </form>
    </div>
  );
}