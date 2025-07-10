'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

interface Poll {
  id: string;
  question: string;
}

export default function Home() {
  const [polls, setPolls] = useState<Poll[]>([]);

  useEffect(() => {
    const fetchPolls = async () => {
      const response = await axios.get(`${API_URL}/polls`);
      setPolls(response.data);
    };
    fetchPolls();
  }, []);

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Список опросов</h1>
      <Link href="/create">
        <button className="px-4 py-2 bg-green-500 text-white rounded">Создать новый опрос</button>
      </Link>
      <ul className="space-y-2">
        {polls.map((poll) => (
          <li key={poll.id}>
            <Link href={`/poll/${poll.id}`} className="text-blue-500 hover:underline">
              {poll.question}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}