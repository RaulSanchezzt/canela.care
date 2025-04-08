import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Canela from "../components/Canela";
import Store from "../components/Store";
import ProfilePanel from "../components/ProfilePanel";

export default function Home() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [hasIncreasedStreak, setHasIncreasedStreak] = useState(false);
  const [loading, setLoading] = useState(true);
  const [taskId, setTaskId] = useState(null);
  const [taskCompletedFlag, setTaskCompletedFlag] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  const router = useRouter();

  const getToday = () => new Date().toISOString().split("T")[0];
  const getYesterday = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }

      setUser(session.user);

      const { data: userRecord, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      let userInfo = userRecord;

      if (error && error.code === "PGRST116") {
        const { data: newUser } = await supabase
          .from("users")
          .insert({ id: session.user.id, alias: null, streak: 0, coins: 0 })
          .select()
          .single();
        userInfo = newUser;
      }

      setUserData(userInfo);
      await loadOrGenerateTasks(session.user.id, userInfo);
    };

    init();
  }, []);

  const loadOrGenerateTasks = async (userId, userData) => {
    setLoading(true);
    const today = getToday();
    const yesterday = getYesterday();

    if (userData?.last_active_date && userData.last_active_date !== today) {
      const { data: yesterdayTask } = await supabase
        .from("daily_tasks")
        .select("completed")
        .eq("user_id", userId)
        .eq("date", yesterday)
        .single();

      if (!yesterdayTask?.completed && userData.streak > 0) {
        await supabase.from("users").update({ streak: 0 }).eq("id", userId);
        setUserData((prev) => ({ ...prev, streak: 0 }));
      }
    }

    const { data: existing } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .limit(1)
      .maybeSingle();

    if (existing) {
      setTasks(existing.tasks);
      setCompleted(existing.completed_indexes || []);
      setTaskId(existing.id);
      setTaskCompletedFlag(existing.completed);
      setHasIncreasedStreak(existing.completed);
    } else {
      const fetchTask = async (category) => {
        const { data } = await supabase
          .from("tasks_library")
          .select("description, category, coins")
          .eq("category", category)
          .limit(10);
        return data?.[Math.floor(Math.random() * data.length)];
      };

      const physical = await fetchTask("Physical");
      const mental = await fetchTask("Mental");
      const social = await fetchTask("Social");

      if (!physical || !mental || !social) {
        setTasks([]);
        setLoading(false);
        return;
      }

      const selectedTasks = [physical, mental, social];

      const { data: inserted } = await supabase
        .from("daily_tasks")
        .insert({
          user_id: userId,
          date: today,
          tasks: selectedTasks,
          completed: false,
          completed_indexes: [],
        })
        .select()
        .single();

      setTasks(inserted.tasks);
      setCompleted([]);
      setTaskId(inserted.id);
    }

    await supabase
      .from("users")
      .update({ last_active_date: today })
      .eq("id", userId);

    setUserData((prev) => ({ ...prev, last_active_date: today }));
    setLoading(false);
  };

  const toggleComplete = async (index) => {
    if (completed.includes(index)) return;

    const updated = [...completed, index];
    setCompleted(updated);

    await supabase
      .from("daily_tasks")
      .update({ completed_indexes: updated })
      .eq("id", taskId);

    const coinsToAdd = tasks[index].coins || 0;
    const newTotalCoins = (userData.coins || 0) + coinsToAdd;

    const { error } = await supabase
      .from("users")
      .update({ coins: newTotalCoins })
      .eq("id", user.id);

    if (!error) {
      setUserData((prev) => ({ ...prev, coins: newTotalCoins }));
    }
  };

  useEffect(() => {
    const checkStreakUpdate = async () => {
      const allCompleted =
        completed.length === tasks.length && tasks.length > 0;

      if (
        allCompleted &&
        !hasIncreasedStreak &&
        userData &&
        taskId &&
        !taskCompletedFlag
      ) {
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
      }
    };

    if (tasks.length > 0) {
      checkStreakUpdate();
    }
  }, [
    completed,
    tasks,
    userData,
    taskId,
    taskCompletedFlag,
    hasIncreasedStreak,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-white flex flex-col items-center justify-start py-10 px-4 pb-24">
      <h1 className="text-3xl font-bold text-purple-700 mb-2">Technovation</h1>
      <h2 className="text-lg font-semibold text-purple-700 mb-4">
        🔥 Streak: {userData?.streak || 0} day
        {userData?.streak !== 1 ? "s" : ""}
      </h2>

      {/* MOBILE view: one module at a time */}
      <div className="lg:hidden w-full">
        {activeTab === "store" && <Store userData={userData} />}
        {activeTab === "home" && (
          <>
            <Canela
              mood={completed.length === tasks.length ? "happy" : "neutral"}
            />
            <div className="w-full max-w-md mt-4">
              {tasks.map((task, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-3 ${
                    completed.includes(index) ? "opacity-60" : ""
                  }`}
                >
                  <div>
                    <p className="text-gray-800 font-medium">
                      {task.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {task.category} • 💰 {task.coins} coins
                    </p>
                  </div>
                  <button
                    onClick={() => toggleComplete(index)}
                    disabled={completed.includes(index)}
                    className={`px-3 py-1 rounded text-white ${
                      completed.includes(index)
                        ? "bg-green-400"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {completed.includes(index) ? "Done" : "Do"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        {activeTab === "profile" && (
          <ProfilePanel userData={userData} setUserData={setUserData} />
        )}
      </div>

      {/* DESKTOP view: all 3 panels */}
      <div className="hidden lg:flex w-full max-w-7xl gap-6 mt-6 min-h-[80vh]">
        <div className="w-1/3 flex flex-col">
          <div className="bg-white rounded-xl shadow-md p-4 h-full min-h-[75vh]">
            <Store userData={userData} />
          </div>
        </div>
        <div className="w-1/3 flex flex-col items-center">
          <div className="bg-white rounded-xl shadow-md p-4 w-full h-full min-h-[75vh] flex flex-col items-center">
            <Canela
              mood={completed.length === tasks.length ? "happy" : "neutral"}
            />
            <div className="w-full max-w-md mt-4">
              {tasks.map((task, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between bg-white p-4 rounded shadow mb-3 ${
                    completed.includes(index) ? "opacity-60" : ""
                  }`}
                >
                  <div>
                    <p className="text-gray-800 font-medium">
                      {task.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {task.category} • 💰 {task.coins} coins
                    </p>
                  </div>
                  <button
                    onClick={() => toggleComplete(index)}
                    disabled={completed.includes(index)}
                    className={`px-3 py-1 rounded text-white ${
                      completed.includes(index)
                        ? "bg-green-400"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {completed.includes(index) ? "Done" : "Do"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-1/3 flex flex-col">
          <div className="bg-white rounded-xl shadow-md p-4 h-full min-h-[75vh]">
            <ProfilePanel userData={userData} setUserData={setUserData} />
          </div>
        </div>
      </div>

      {/* MOBILE Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around items-center p-2 lg:hidden z-50">
        <button
          onClick={() => setActiveTab("store")}
          className={`flex flex-col items-center text-sm ${
            activeTab === "store"
              ? "text-purple-600 font-semibold"
              : "text-gray-500"
          }`}
        >
          🛍️<span>Store</span>
        </button>
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center text-sm ${
            activeTab === "home"
              ? "text-purple-600 font-semibold"
              : "text-gray-500"
          }`}
        >
          🧩<span>Tasks</span>
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center text-sm ${
            activeTab === "profile"
              ? "text-purple-600 font-semibold"
              : "text-gray-500"
          }`}
        >
          👤<span>Profile</span>
        </button>
      </div>
    </div>
  );
}
