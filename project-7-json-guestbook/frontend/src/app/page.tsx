'use client';

import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';

interface Entry {
  id: string;
  name: string;
  message: string;
  timestamp: string;
}

const API_URL = 'http://localhost:8000/api/entries';

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState('');

  const [page, setPage] = useState(1);
  const [limit] = useState(5); // Записей на странице

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${API_URL}?page=${page}&limit=${limit}`);
      const sortedEntries = response.data.sort((a: Entry, b: Entry) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setEntries(sortedEntries);
    } catch (err) {
      setError('Не удалось загрузить записи.');
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [page]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      setError('Имя и сообщение не могут быть пустыми.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(API_URL, { name, message });
      setName('');
      setMessage('');
      fetchEntries();
    } catch (err) {
      setError('Ошибка при отправке сообщения.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchEntries();
    } catch (err) {
      setError('Не удалось удалить запись.');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await axios.put(`${API_URL}/${id}`, { message: editingMessage });
      setEditingId(null);
      setEditingMessage('');
      fetchEntries();
    } catch (err) {
      setError('Не удалось обновить сообщение.');
    }
  };

  return (
    <main className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Гостевая Книга</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4">Оставить запись</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 mb-1">Ваше имя</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Аноним"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="message" className="block text-gray-700 mb-1">Сообщение</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="Всем привет!"
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {loading ? 'Отправка...' : 'Отправить'}
          </button>
        </form>

        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white p-4 rounded-lg shadow">
              {editingId === entry.id ? (
                <div>
                  <textarea
                    className="w-full px-3 py-2 border rounded-md"
                    value={editingMessage}
                    onChange={(e) => setEditingMessage(e.target.value)}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => handleUpdate(entry.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-600 hover:underline"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-800">{entry.message}</p>
                  <div className="text-right text-sm text-gray-500 mt-2 flex justify-between items-center">
                    <span><strong>- {entry.name}</strong> в {new Date(entry.timestamp).toLocaleString()}</span>
                    <div className="space-x-2">
                      <button
                        onClick={() => {
                          setEditingId(entry.id);
                          setEditingMessage(entry.message);
                        }}
                        className="text-blue-500 hover:underline"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-500 hover:underline"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded disabled:opacity-50"
          >
            Назад
          </button>
          <span>Страница {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
          >
            Вперед
          </button>
        </div>
      </div>
    </main>
  );
}