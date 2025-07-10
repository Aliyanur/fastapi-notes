'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface Post {
  slug: string;
  title: string;
  author: string;
  date: string;
  category: string;
}

const API_URL = 'http://localhost:8000/api/posts';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Все категории');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(API_URL);
        setPosts(response.data);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Список всех категорий без повторений
  const categories = Array.from(new Set(posts.map((post) => post.category)));

  // Фильтруем посты по выбранной категории
  const filteredPosts =
    selectedCategory === 'Все категории'
      ? posts
      : posts.filter((post) => post.category === selectedCategory);

  return (
    <main className="flex flex-col items-center min-h-screen bg-black-100 p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-5xl font-bold mb-8 text-center text-black-800">
          Минималистичный Блог
        </h1>

        {/* Фильтр по категориям */}
        <div className="mb-6">
          <label htmlFor="category" className="mr-2 font-medium">
            Фильтр по категории:
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 rounded border border-red-300"
          >
            <option>Все категории</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Загрузка постов...</p>
        ) : filteredPosts.length === 0 ? (
          <p>Нет постов в выбранной категории.</p>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow"
              >
                <h2 className="text-2xl font-semibold text-blue-600">{post.title}</h2>
                <p className="text-sm text-red-500">
                  Автор: {post.author} | Дата: {post.date} | Категория: {post.category}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}