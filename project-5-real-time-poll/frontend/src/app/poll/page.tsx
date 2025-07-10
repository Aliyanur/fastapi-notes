'use client';

import { useParams } from 'next/navigation';
import axios from 'axios';
import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:8000/api';

interface PollOption {
  label: string;
  votes: number;
}
interface PollData {
  question: string;
  options: Record<string, PollOption>;
}

export default function PollPage() {
  const { poll_id } = useParams();
  const [pollData, setPollData] = useState<PollData | null>(null);
  const [voted, setVoted] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const res = await axios.get(`${API_URL}/poll/${poll_id}`);
        setPollData(res.data);
      } catch (err) {
        console.error('Ошибка загрузки опроса', err);
      }
    };
    fetchPoll();
  }, [poll_id]);

  const handleVote = async (optionKey: string) => {
    if (voted) return;
    try {
      const res = await axios.post(`${API_URL}/poll/vote/${poll_id}/${optionKey}`);
      setPollData(res.data);
      setVoted(optionKey);
    } catch (err) {
      console.error('Ошибка голосования', err);
    }
  };

  const totalVotes = pollData ? Object.values(pollData.options).reduce((sum, o) => sum + o.votes, 0) : 0;

  if (!pollData) return <p>Загрузка...</p>;

  return (
    <main className="p-8 space-y-4">
      <h1 className="text-xl font-bold">{pollData.question}</h1>
      {Object.entries(pollData.options).map(([key, option]) => {
        const percent = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
        return (
          <div key={key} className="mb-4">
            <p>{option.label} — {option.votes} голосов ({percent.toFixed(1)}%)</p>
            <button
              onClick={() => handleVote(key)}
              disabled={!!voted}
              className={`px-4 py-2 mt-1 text-white rounded ${voted ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              {voted === key ? 'Ваш голос' : 'Голосовать'}
            </button>
          </div>
        );
      })}
    </main>
  );
}