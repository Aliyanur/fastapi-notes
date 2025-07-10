'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import Image from 'next/image';

const API_URL = 'http://localhost:8000';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fetchImages = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/images`);
      setImages(response.data);
    } catch (err) {
      console.error('Failed to fetch images:', err);
      setError('Не удалось загрузить галерею.');
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Пожалуйста, выберите файл для загрузки.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / (event.total || 1));
          setProgress(percent);
        }
      });

      fetchImages();
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка загрузки файла.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async (url: string) => {
    const filename = url.split('/').pop();
    if (!filename) return;

    try {
      await axios.delete(`${API_URL}/api/images/${filename}`);
      fetchImages();
    } catch (err) {
      setError('Ошибка при удалении изображения.');
    }
  };

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-center mb-8">Галерея Изображений</h1>

      <form
        onSubmit={handleUpload}
        className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mb-12"
      >
        <div className="mb-4">
          <label htmlFor="file-upload" className="block text-gray-700 text-sm font-bold mb-2">
            Выберите изображение:
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <button
          type="submit"
          disabled={!selectedFile || uploading}
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          {uploading ? 'Загрузка...' : 'Загрузить'}
        </button>

        {uploading && (
          <div className="w-full bg-gray-200 rounded mt-4">
            <div
              className="bg-blue-500 text-xs leading-none py-1 text-center text-white rounded"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-xs italic mt-4">{error}</p>}
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((imgUrl, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden shadow-lg group">
            <Image
              src={
                imgUrl.startsWith('http://') || imgUrl.startsWith('https://')
                  ? imgUrl
                  : `${API_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`
              }
              alt={`Uploaded image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={index < 4}
            />
            <button
              onClick={() => handleDelete(imgUrl)}
              className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition"
              title="Удалить"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}