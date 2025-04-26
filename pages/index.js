import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/home");
      }
    });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({ email });

    if (error) {
      setMessage("❌ " + error.message);
      setLoading(false);
    } else {
      setMessage("✅ Check your email for the login link!");
      setShowModal(true); // ✅ Abrir modal
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 via-white to-purple-200 flex flex-col">
      <header className="flex justify-between items-center p-6">
        <h1 className="text-5xl font-extrabold text-purple-800">Canela Care</h1>
      </header>

      <main className="flex flex-col items-center text-center flex-1 p-6">
        <div className="flex justify-center mb-6">
          <img
            src="/img/canela-happy.png"
            alt="Canela the mascot"
            className="w-40 h-40 rounded-full border-4 border-purple-500 shadow-md transition-transform duration-300 scale-105 rotate-1"
          />
        </div>
        <h2 className="text-4xl font-bold mb-4 text-gray-800">
          Improve your body and mind, one task at a time.
        </h2>
        <p className="text-lg max-w-xl mb-8 text-gray-700">
          Canela Care is your personal companion for daily physical, mental, and
          social wellbeing. Earn coins, complete missions, and grow stronger
          every day!
        </p>

        <form
          onSubmit={handleLogin}
          className="bg-purple-100 p-8 rounded-3xl shadow-2xl flex flex-col gap-4 w-full max-w-md border border-purple-300"
        >
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="px-4 py-2 border border-gray-300 rounded-full bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={loading}
            className={`${
              loading ? "bg-purple-300" : "bg-purple-600 hover:bg-purple-700"
            } text-white font-semibold py-2 rounded-full transition`}
          >
            {loading ? "Sending..." : "Get Started"}
          </button>
          {message && <p className="text-sm text-gray-700">{message}</p>}
        </form>

        <div className="mt-10 w-full max-w-5xl text-gray-700 flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">How to get started</h3>
            <p>
              Simply enter a valid email address above. You will receive an
              email from us with a magic link. Click the link and you will be
              automatically logged into Canela Care. No need to remember any
              passwords!
            </p>
          </div>

          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">Stay motivated</h3>
            <p>
              Our features and challenges are fun and turn self-care into a
              game! You'll effortlessly build healthy habits and stay
              consistent. Plus, you'll receive adorable reminders from our
              lovely mascot, Canela. 🐾
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center text-gray-500 text-sm p-4">
        Made with ❤️ by Canela Care.
      </footer>

      {/* Modal para mostrar mensaje */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-b from-black/40 via-black/20 to-transparent backdrop-blur-sm z-50 transition-opacity duration-300">
          <div className="bg-white/80 rounded-2xl shadow-2xl p-6 text-center max-w-xs w-full transform transition-all duration-300 scale-90 opacity-0 animate-fadeIn backdrop-blur-md">
            <h2 className="text-2xl font-bold text-purple-700 mb-4">
              📬 Check your Email!
            </h2>
            <p className="text-gray-700 mb-4">
              We sent you a magic link. Tap it to access Canela Care.
            </p>
            <button
              onClick={() => {
                setShowModal(false);
                setLoading(false);
              }}
              className="bg-purple-600 text-white px-5 py-2 rounded-full hover:bg-purple-700 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
