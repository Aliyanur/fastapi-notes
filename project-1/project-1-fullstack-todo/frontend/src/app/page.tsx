'use client'; // This directive is necessary for using React hooks

import { useState, useEffect, FormEvent } from 'react';
import axios from 'axios';

// Define the type for a single To-Do item to match the backend
interface Todo {
  id: string;
  task: string;
  completed: boolean;
}

// The base URL of our FastAPI backend
const API_URL = 'http://localhost:8000/api/todos';

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null); // Track the task being edited
  const [editedTask, setEditedTask] = useState<string>(''); // Store the new task text when editing

  // 1. Fetch all todos from the backend when the component mounts
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await axios.get(API_URL);
        setTodos(response.data);
      } catch (error) {
        console.error('Error fetching todos:', error);
      }
    };
    fetchTodos();
  }, []); // Empty dependency array means this runs once on mount

  // 2. Handle form submission to add a new task
  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault(); // Prevent page reload
    if (!newTask.trim()) return; // Don't add empty tasks

    try {
      const response = await axios.post(API_URL, { task: newTask });
      setTodos([...todos, response.data]); // Add new task to the list
      setNewTask(''); // Clear the input field
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // 3. Handle toggling the completed status of a task
  const handleToggleComplete = async (id: string) => {
    try {
      const response = await axios.patch(`${API_URL}/${id}`);
      setTodos(todos.map(todo => (todo.id === id ? response.data : todo)));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // 4. Handle deleting a task
  const handleDeleteTask = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTodos(todos.filter(todo => todo.id !== id)); // Remove task from the list
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // 5. Handle editing a task
  const handleEditTask = async (id: string) => {
    try {
      await axios.put(`${API_URL}/${id}`, { task: editedTask });
      setTodos(todos.map(todo => (todo.id === id ? { ...todo, task: editedTask } : todo)));
      setEditingId(null); // Stop editing after saving
      setEditedTask('');
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // 6. Handle clearing all completed tasks
  const handleClearCompleted = async () => {
    try {
      await axios.delete('http://localhost:8000/api/todos/completed');  // Убедись, что путь правильный
      setTodos(todos.filter(todo => !todo.completed));  // Удаляем выполненные задачи из UI
    } catch (error) {
      console.error('Error clearing completed tasks:', error);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-8">
      <div className="w-full max-w-md bg-white p-6 rounded-md shadow-md">
        <h1 className="text-2xl font-semibold mb-6 text-center text-gray-900">
          To-Do List
        </h1>

        {/* Form to add a new task */}
        <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="flex-grow p-3 rounded-md bg-gray-200 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md transition duration-200"
          >
            Add
          </button>
        </form>

        {/* Button to clear completed tasks */}
        <button
          onClick={handleClearCompleted}
          className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-md transition duration-200 mb-6"
        >
          Clear All Completed Tasks
        </button>

        {/* List of tasks */}
        <ul className="space-y-4">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center justify-between p-3 bg-gray-200 rounded-md transition duration-200 hover:shadow-md"
            >
              {editingId === todo.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editedTask}
                    onChange={(e) => setEditedTask(e.target.value)}
                    className="p-3 rounded-md bg-gray-200 border border-gray-300 focus:outline-none"
                  />
                  <button
                    onClick={() => handleEditTask(todo.id)}
                    className="bg-green-600 hover:bg-green-700 text-white py-1 px-4 rounded-md transition duration-200"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="bg-gray-600 hover:bg-gray-700 text-white py-1 px-4 rounded-md transition duration-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span
                    onClick={() => handleToggleComplete(todo.id)}
                    className={`cursor-pointer ${todo.completed ? 'line-through text-gray-500' : ''}`}
                  >
                    {todo.task}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(todo.id)}
                    className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded-md transition duration-200"
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(todo.id);
                      setEditedTask(todo.task);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded-md transition duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleComplete(todo.id)}
                    className="bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded-md transition duration-200"
                  >
                    {todo.completed ? 'Undo' : 'Complete'}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
