import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import confetti from "canvas-confetti";
import Canela from "../components/Canela";
import Store from "../components/Store";
import ProfilePanel from "../components/ProfilePanel";
import { ShoppingBag, CheckSquare, User } from "lucide-react";

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
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

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

      const { data: inserted, error } = await supabase
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

      if (error) {
        console.error(error);
        setTasks([]);
      } else if (inserted) {
        setTasks(inserted.tasks);
        setCompleted([]);
        setTaskId(inserted.id);
      } else {
        console.error("No tasks were inserted.");
        setTasks([]);
      }
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

      // 🎉 Confeti normal al completar una tarea
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // 🎯 Si completas todas las tareas
      const allCompleted = updated.length === tasks.length && tasks.length > 0;

      if (allCompleted && !hasCelebrated) {
        setTimeout(() => {
          superConfetti();
          setShowCongratsModal(true);
          setHasCelebrated(true);
        }, 500);
      }
    }
  };

  const superConfetti = () => {
    confetti({
      particleCount: 300,
      spread: 150,
      startVelocity: 45,
      origin: { y: 0.6 },
    });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-white flex flex-col items-center justify-start py-10 px-4 pb-24">
      <h1 className="text-3xl font-bold text-purple-700 mb-2">Canela Care</h1>
      <h2 className="text-lg font-semibold text-purple-700 mb-4">
        🔥 Streak: {userData?.streak || 0} day
        {userData?.streak !== 1 ? "s" : ""}
      </h2>

      {/* MOBILE view */}
      <div className="lg:hidden w-full">
        {activeTab === "store" && (
          <Store userData={userData} setUserData={setUserData} />
        )}
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
                    className={`px-3 py-1 rounded text-white transform transition-transform ${
                      completed.includes(index)
                        ? "bg-green-400 scale-110"
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

      {/* DESKTOP view */}
      <div className="hidden lg:flex w-full max-w-7xl gap-6 mt-6 min-h-[80vh]">
        <div className="w-1/3 flex flex-col">
          <div className="bg-white rounded-xl shadow-md p-4 h-full min-h-[75vh]">
            <Store userData={userData} setUserData={setUserData} />
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
                    className={`px-3 py-1 rounded text-white transform transition-transform ${
                      completed.includes(index)
                        ? "bg-green-400 scale-110"
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

      {/* Congratulations Modal */}
      {showCongratsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl text-center max-w-xs w-full transform transition-all scale-100 opacity-100">
            <h2 className="text-2xl font-bold text-purple-700 mb-4">
              🎉 Congratulations! 🎉
            </h2>
            <p className="text-gray-700 mb-4">
              You completed all your tasks for today!
            </p>
            <button
              onClick={() => setShowCongratsModal(false)}
              className="bg-purple-600 text-white px-5 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}

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
          <ShoppingBag className="w-6 h-6 mb-1" />
          <span>Store</span>
        </button>
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center text-sm ${
            activeTab === "home"
              ? "text-purple-600 font-semibold"
              : "text-gray-500"
          }`}
        >
          <CheckSquare className="w-6 h-6 mb-1" />
          <span>Tasks</span>
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center text-sm ${
            activeTab === "profile"
              ? "text-purple-600 font-semibold"
              : "text-gray-500"
          }`}
        >
          <User className="w-6 h-6 mb-1" />
          <span>Profile</span>
        </button>
      </div>
    </div>
  );
}
