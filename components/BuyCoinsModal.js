import { useEffect, useState } from "react";
import { Coins } from "lucide-react";

export default function BuyCoinsModal({ onClose, onPurchase }) {
  const coinOptions = [
    { coins: 50, price: "1.50€" },
    { coins: 100, price: "2.99€" },
    { coins: 250, price: "4.50€" },
    { coins: 500, price: "5.99€" },
  ];

  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handlePurchase = async () => {
    setLoading(true);
    setProgress(0);
    setMessage("Checking data...");

    for (let i = 1; i <= 5; i++) {
      await new Promise((res) => setTimeout(res, 1000));
      setProgress(i * 20);
      if (i === 2) setMessage("Verifying balance...");
      if (i === 4) setMessage("Finalizing...");
    }

    onPurchase(selected);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur bg-black/40 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center animate-fade-in">
        <h2 className="text-2xl font-bold text-purple-700 mb-2">Buy Coins</h2>
        <p className="text-sm text-gray-500 mb-4">
          This is a demo — no real money will be charged.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {coinOptions.map(({ coins, price }) => (
            <div
              key={coins}
              onClick={() => !loading && setSelected(coins)}
              className={`cursor-pointer rounded-lg p-3 border-2 ${
                selected === coins
                  ? "border-purple-600 bg-purple-50"
                  : "border-gray-200"
              } flex flex-col items-center transition ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Coins className="w-6 h-6 text-yellow-500 mb-1" />
              <span className="font-semibold text-gray-600">{coins} coins</span>
              <span className="text-xs text-gray-600 mt-1">{price}</span>
            </div>
          ))}
        </div>

        <div className="relative w-full">
          <button
            disabled={!selected || loading}
            onClick={handlePurchase}
            className={`w-full py-2 rounded-lg text-white font-semibold transition ${
              selected && !loading
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-gray-300 cursor-not-allowed"
            } relative z-10`}
          >
            {loading
              ? message
              : selected
              ? `Purchase ${selected} coins`
              : "Select a package"}
          </button>
          {loading && (
            <div
              className="absolute top-0 left-0 h-full bg-purple-400 rounded-lg transition-all duration-300"
              style={{ width: `${progress}%`, zIndex: 0 }}
            ></div>
          )}
        </div>

        {loading && (
          <div className="mt-4 flex justify-center">
            <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <button
          onClick={onClose}
          disabled={loading}
          className="mt-3 text-sm text-gray-500 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
