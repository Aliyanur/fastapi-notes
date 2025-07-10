'use client';

import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';
import Image from 'next/image';

interface WeatherData {
  city_name: string;
  temperature: number;
  description: string;
  icon: string;
}

const API_URL = 'http://localhost:8000/api/weather/coords'; // Updated to use the geolocation endpoint

export default function Home() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    setLoading(true);
    setError('');
    setWeather(null);
    try {
      const response = await axios.get(`${API_URL}?lat=${lat}&lon=${lon}`);
      setWeather(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить данные о погоде.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherByCoords(latitude, longitude); // Fetch weather for the current coordinates
        },
        (error) => {
          setError('Не удалось получить геолокацию. Пожалуйста, предоставьте разрешение.');
          setLoading(false);
        }
      );
    } else {
      setError('Геолокация не поддерживается этим браузером.');
      setLoading(false);
    }
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-300 p-4">
      <div className="w-full max-w-sm bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">Погода</h1>

        {loading && <p className="text-center text-gray-700">Загрузка...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {weather && (
          <div className="flex flex-col items-center text-center text-gray-900">
            <h2 className="text-3xl font-semibold">{weather.city_name}</h2>
            <div className="flex items-center">
              <p className="text-6xl font-light">{Math.round(weather.temperature)}°C</p>
              <Image
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.description}
                width={100}
                height={100}
              />
            </div>
            <p className="text-lg capitalize">{weather.description}</p>
          </div>
        )}
      </div>
    </main>
  );
}
