'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
}

const API_URL = 'http://localhost:8000/api';

export default function Home() {
  // Состояния для данных
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Состояния для фильтров
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Состояние загрузки
  const [loading, setLoading] = useState(true);

  const [sortOption, setSortOption] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Загрузка категорий один раз при монтировании компонента
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categories`);
        setCategories(['All', ...response.data]);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Основной эффект для загрузки продуктов при изменении фильтров
useEffect(() => {
  const delayDebounce = setTimeout(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);
        if (sortOption) params.append('sort', sortOption);
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);

        const response = await axios.get(`${API_URL}/products?${params.toString()}`);
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, 400); // debounce delay 400ms

  return () => clearTimeout(delayDebounce);
}, [searchTerm, selectedCategory, sortOption, minPrice, maxPrice]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm p-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-gray-800">Каталог товаров</h1>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {/* Панель фильтров */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-white p-4 rounded-lg shadow">
  <input
    type="text"
    placeholder="Поиск по названию..."
    value={searchTerm}
    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
    className="p-2 border rounded-md w-full"
  />
  <select
    value={selectedCategory}
    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
    className="p-2 border rounded-md w-full"
  >
    {categories.map(cat => (
      <option key={cat} value={cat}>{cat}</option>
    ))}
  </select>
  <select
    value={sortOption}
    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSortOption(e.target.value)}
    className="p-2 border rounded-md w-full"
  >
    <option value="">Сортировка</option>
    <option value="price_asc">По цене: сначала дешевые</option>
    <option value="price_desc">По цене: сначала дорогие</option>
  </select>
  <div className="flex space-x-2">
    <input
      type="number"
      placeholder="Мин. цена"
      value={minPrice}
      onChange={(e: ChangeEvent<HTMLInputElement>) => setMinPrice(e.target.value)}
      className="p-2 border rounded-md w-full"
    />
    <input
      type="number"
      placeholder="Макс. цена"
      value={maxPrice}
      onChange={(e: ChangeEvent<HTMLInputElement>) => setMaxPrice(e.target.value)}
      className="p-2 border rounded-md w-full"
    />
  </div>
</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-white p-4 rounded-lg shadow">
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="p-2 border rounded-md w-full"
          />
          <select
            value={selectedCategory}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
            className="p-2 border rounded-md w-full"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Сетка товаров */}
        {loading ? (
          <p className="text-center">Загрузка товаров...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.length > 0 ? products.map(product => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
                <div className="p-6">
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{product.category}</span>
                  <h2 className="text-xl font-bold text-gray-800 mt-2 h-16">{product.name}</h2>
                  <p className="text-2xl font-light text-blue-600 mt-4">${product.price}</p>
                </div>
              </div>
            )) : (
              <p className="col-span-full text-center">Товары не найдены.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}