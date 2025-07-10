'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const role = localStorage.getItem('user_role');

    if (!token) {
      router.replace('/login');
    } else {
      if (role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return <p>Перенаправление...</p>;
  }

  return null;
}