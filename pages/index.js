import Canela from "../components/Canela";
import { useState, useEffect } from "react";

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [streak, setStreak] = useState(0);
  const [hasIncreasedStreak, setHasIncreasedStreak] = useState(false);
  const [loading, setLoading] = useState(true); // Arrancamos en loading hasta cargar las tareas

  const allTasksCompleted =
    completed.length === tasks.length && tasks.length > 0;

  const toggleComplete = (index) => {
    if (completed.includes(index)) {
      setCompleted(completed.filter((i) => i !== index));
    } else {
      setCompleted([...completed, index]);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-tasks");
      const data = await res.json();

      if (data.tasks) {
        const cleanedTasks = data.tasks.map((task) => task.trim());
        setTasks(cleanedTasks);
        setCompleted([]);
        setHasIncreasedStreak(false);
      } else {
        alert("No tasks returned!");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      alert("Error fetching tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(); // Solo carga al inicio
  }, []);

  useEffect(() => {
    if (allTasksCompleted && !hasIncreasedStreak) {
      setStreak((prevStreak) => prevStreak + 1);
      setHasIncreasedStreak(true);
      console.log("🎉 Streak increased! New streak:", streak + 1);
    }

    if (!allTasksCompleted && hasIncreasedStreak) {
      setHasIncreasedStreak(false);
    }
  }, [allTasksCompleted, hasIncreasedStreak, streak]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-white flex flex-col items-center justify-start py-10">
      <h1 className="text-3xl font-bold text-purple-700 mb-4">
        Welcome to Tech!
      </h1>

      <h2 className="text-xl font-semibold text-green-600 mb-2">
        🔥 Streak: {streak} day{streak !== 1 ? "s" : ""}
      </h2>

      <Canela mood={allTasksCompleted ? "happy" : "neutral"} />

      {loading ? (
        <p className="text-gray-600 mt-6">Loading today's tasks...</p>
      ) : (
        <div className="w-full max-w-md mt-6 px-4">
          {tasks.map((task, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white p-4 rounded shadow mb-3"
            >
              <p
                className={
                  completed.includes(index)
                    ? "line-through text-gray-500"
                    : "text-gray-800"
                }
              >
                {task}
              </p>
              <button
                onClick={() => toggleComplete(index)}
                className={`px-3 py-1 rounded text-white ${
                  completed.includes(index) ? "bg-green-400" : "bg-blue-500"
                }`}
              >
                {completed.includes(index) ? "Done" : "Do"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
