'use client';

import { useState, FormEvent } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const API_URL = 'http://localhost:8000/api/poll/create';

export default function CreatePollPage() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Удаляем пустые опции
    const validOptions = options.filter((opt) => opt.trim() !== '');
    if (!question.trim() || validOptions.length < 2) {
      setError('Введите вопрос и минимум 2 варианта ответа.');
      setLoading(false);
      return;
    }

    try {
      await axios.post(API_URL, {
        question,
        options: validOptions,
      });
      router.push('/'); // После успешного создания переходим на главную (список опросов)
    } catch (err) {
      console.error('Ошибка создания опроса:', err);
      setError('Ошибка создания опроса. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-xl p-8 bg-black rounded-xl shadow-lg space-y-6">
        <h1 className="text-2xl font-bold text-center">Создание нового опроса</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Вопрос опроса:</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Введите вопрос..."
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Варианты ответов:</label>
            {options.map((opt, idx) => (
              <input
                key={idx}
                type="text"
                value={opt}
                onChange={(e) => handleOptionChange(idx, e.target.value)}
                placeholder={`Вариант ${idx + 1}`}
                className="w-full mb-2 p-2 border rounded-lg"
              />
            ))}
            <button
              type="button"
              onClick={addOption}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              + Добавить вариант
            </button>
          </div>

          {error && <p className="text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 disabled:bg-green-400"
          >
            {loading ? 'Создаём...' : 'Создать опрос'
            }
          </button>
        </form>
      </div>
    </main>
  );
}