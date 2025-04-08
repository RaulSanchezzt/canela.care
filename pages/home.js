import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import { Menu, X } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [aliasInput, setAliasInput] = useState("");
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [hasIncreasedStreak, setHasIncreasedStreak] = useState(false);
  const [loading, setLoading] = useState(true);
  const [taskId, setTaskId] = useState(null);
  const [taskCompletedFlag, setTaskCompletedFlag] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push("/");
      } else {
        setUser(session.user);
        await checkOrCreateUser(session.user);
        await loadOrGenerateTasks(session.user.id);
      }
    });
  }, []);

  const checkOrCreateUser = async (supabaseUser) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", supabaseUser.id)
      .single();

    if (error && error.code === "PGRST116") {
      const { data: newUser } = await supabase
        .from("users")
        .insert({ id: supabaseUser.id, alias: null, streak: 0 })
        .select()
        .single();

      setUserData(newUser);
    } else if (data) {
      setUserData(data);
    }
  };

  const loadOrGenerateTasks = async (userId) => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];

    const { data: existing, error } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (existing) {
      setTasks(existing.tasks);
      setCompleted(existing.completed_indexes || []);
      setTaskId(existing.id);
      setTaskCompletedFlag(existing.completed);
      setHasIncreasedStreak(existing.completed);
    } else {
      try {
        const res = await fetch("/api/generate-tasks");
        const data = await res.json();
        if (data.tasks) {
          const cleaned = data.tasks.map((t) => t.trim());

          const { data: inserted } = await supabase
            .from("daily_tasks")
            .insert({
              user_id: userId,
              date: today,
              tasks: cleaned,
              completed: false,
              completed_indexes: [],
            })
            .select()
            .single();

          setTasks(cleaned);
          setCompleted([]);
          setTaskId(inserted.id);
        }
      } catch (err) {
        console.error("Error generating tasks:", err);
      }
    }
    setLoading(false);
  };

  const updateCompletedInDB = async (indexes) => {
    if (taskId) {
      await supabase
        .from("daily_tasks")
        .update({ completed_indexes: indexes })
        .eq("id", taskId);
    }
  };

  const toggleComplete = async (index) => {
    let updated;
    if (completed.includes(index)) {
      updated = completed.filter((i) => i !== index);
    } else {
      updated = [...completed, index];
    }
    setCompleted(updated);
    await updateCompletedInDB(updated);
  };

  useEffect(() => {
    const allCompleted = completed.length === tasks.length && tasks.length > 0;

    if (
      allCompleted &&
      !hasIncreasedStreak &&
      userData &&
      taskId &&
      !taskCompletedFlag
    ) {
      const updateStreakAndTask = async () => {
        const newStreak = userData.streak + 1;

        const { error: userError } = await supabase
          .from("users")
          .update({ streak: newStreak })
          .eq("id", user.id);

        const { error: taskError } = await supabase
          .from("daily_tasks")
          .update({ completed: true })
          .eq("id", taskId);

        if (!userError && !taskError) {
          setUserData((prev) => ({ ...prev, streak: newStreak }));
          setHasIncreasedStreak(true);
          setTaskCompletedFlag(true);
        }
      };

      updateStreakAndTask();
    }
  }, [
    completed,
    tasks,
    hasIncreasedStreak,
    userData,
    taskId,
    taskCompletedFlag,
  ]);

  const handleAliasSave = async () => {
    const trimmedAlias = aliasInput.trim();
    if (trimmedAlias === "") return;

    const { error } = await supabase
      .from("users")
      .update({ alias: trimmedAlias })
      .eq("id", user.id);

    if (!error) {
      setUserData((prev) => ({ ...prev, alias: trimmedAlias }));
      setIsEditingAlias(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const canelaImage =
    completed.length === tasks.length && tasks.length > 0
      ? "/img/canela-happy.png"
      : "/img/canela-neutral.png";

  if (!user || !userData)
    return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="min-h-screen flex flex-row bg-gradient-to-b from-purple-200 to-white">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen bg-purple-700 text-white w-64 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 z-50 md:relative md:block`}
      >
        <div className="p-6 font-bold text-xl border-b border-purple-500">
          Tech
        </div>
        <nav className="flex flex-col gap-4 p-6">
          <button
            onClick={() => router.push("/home")}
            className="text-left hover:underline"
          >
            🏠 Home
          </button>
          <button className="text-left hover:underline">📆 History</button>
          <button className="text-left hover:underline">📊 Progress</button>
          <button className="text-left hover:underline">⚙️ Settings</button>
          <button
            onClick={handleLogout}
            className="text-left text-red-300 hover:text-red-400"
          >
            🚪 Logout
          </button>
        </nav>
      </div>

      {/* Mobile menu toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 left-4 md:hidden z-50"
      >
        {sidebarOpen ? (
          <X size={28} className="text-purple-700" />
        ) : (
          <Menu size={28} className="text-purple-700" />
        )}
      </button>

      {/* Main content */}
      <main className="flex-1 p-6 md:ml-64 mt-12 md:mt-0 min-h-screen">
        <h1 className="text-3xl font-bold text-purple-700 mb-2">
          Welcome back{userData.alias ? `, ${userData.alias}` : ""}!
        </h1>

        <h2 className="text-xl font-semibold text-green-600 mb-4">
          🔥 Streak: {userData.streak} day{userData.streak !== 1 ? "s" : ""}
        </h2>

        <div className="flex justify-center mb-4">
          <img
            src={canelaImage}
            alt="Canela the mascot"
            className="w-40 h-40 rounded-full border-4 border-purple-500 shadow-md transition-transform duration-300"
          />
        </div>

        {/* Alias */}
        <div className="mb-6 flex flex-col items-start gap-2">
          {isEditingAlias ? (
            <div className="flex flex-col gap-2">
              <input
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                placeholder="Enter your alias"
                className="px-4 py-2 border border-purple-300 rounded-full shadow-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleAliasSave}
                  className="bg-purple-600 text-white px-4 py-1 rounded-full shadow hover:bg-purple-700 transition"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingAlias(false)}
                  className="text-sm text-gray-500 hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setAliasInput(userData.alias || "");
                setIsEditingAlias(true);
              }}
              className="text-sm text-purple-700 underline hover:text-purple-900"
            >
              {userData.alias ? "✏️ Edit your alias" : "📝 Set your alias"}
            </button>
          )}
        </div>

        {/* Lista de tareas */}
        {loading ? (
          <p className="mt-6 text-gray-600">Loading today's tasks...</p>
        ) : (
          <div className="w-full max-w-md mt-6">
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
      </main>
    </div>
  );
}
