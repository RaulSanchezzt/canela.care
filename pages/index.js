import Canela from "../components/Canela";
import { useState, useEffect } from "react";

export default function Home() {
  const [tasks, setTasks] = useState([
    "Go for a 30-minute walk",
    "Read 10 pages of a book",
    "Write 3 things you're grateful for",
  ]);

  const [completed, setCompleted] = useState([]);
  const [streak, setStreak] = useState(0);
  const [hasIncreasedStreak, setHasIncreasedStreak] = useState(false);

  const allTasksCompleted = completed.length === tasks.length;

  const toggleComplete = (task) => {
    if (completed.includes(task)) {
      setCompleted(completed.filter((t) => t !== task));
    } else {
      setCompleted([...completed, task]);
    }
  };

  useEffect(() => {
    if (allTasksCompleted && !hasIncreasedStreak) {
      setStreak(streak + 1);
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

      <div className="w-full max-w-md mt-6 px-4">
        {tasks.map((task, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-white p-4 rounded shadow mb-3"
          >
            <p
              className={
                completed.includes(task)
                  ? "line-through text-gray-500"
                  : "text-gray-800"
              }
            >
              {task}
            </p>
            <button
              onClick={() => toggleComplete(task)}
              className={`px-3 py-1 rounded text-white ${
                completed.includes(task) ? "bg-green-400" : "bg-blue-500"
              }`}
            >
              {completed.includes(task) ? "Done" : "Do"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
