import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Store({ userData, setUserData }) {
  const [costumes, setCostumes] = useState([]);
  const [ownedCostumeIds, setOwnedCostumeIds] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // "confirm" o "result"
  const [modalMessage, setModalMessage] = useState("");
  const [selectedCostume, setSelectedCostume] = useState(null);

  useEffect(() => {
    if (userData) {
      fetchCostumes();
      fetchOwnedCostumes();
    }
  }, [userData]);

  async function fetchCostumes() {
    const { data, error } = await supabase
      .from("costumes")
      .select("*")
      .limit(9);

    if (error) {
      console.error("Error loading costumes:", error);
    } else {
      setCostumes(data || []);
    }
  }

  async function fetchOwnedCostumes() {
    const { data, error } = await supabase
      .from("user_costumes")
      .select("costume_id")
      .eq("user_id", userData.id);

    if (error) {
      console.error("Error loading owned costumes:", error);
    } else {
      const ids = data.map((c) => c.costume_id);
      setOwnedCostumeIds(ids);
    }
  }

  function handleBuyClick(costume) {
    setSelectedCostume(costume);
    setModalType("confirm");
    setModalMessage(
      `Do you want to buy "${costume.name}" for ${costume.price} coins?`
    );
    setShowModal(true);
  }

  async function confirmBuy() {
    if (!selectedCostume) return;

    const { id: costumeId, price } = selectedCostume;

    // Verificar si ya tiene comprado este accesorio
    const { data: existing, error: checkError } = await supabase
      .from("user_costumes")
      .select("*")
      .eq("user_id", userData.id)
      .eq("costume_id", costumeId)
      .single();

    if (existing) {
      setModalType("result");
      setModalMessage("You already own this accessory! 🎩");
      return;
    }

    if ((userData?.coins || 0) < price) {
      setModalType("result");
      setModalMessage("You don't have enough coins! 💸");
      return;
    }

    const { error: insertError } = await supabase
      .from("user_costumes")
      .insert([{ user_id: userData.id, costume_id: costumeId }]);

    if (insertError) {
      console.error("Error buying costume:", insertError);
      setModalType("result");
      setModalMessage("Failed to purchase accessory. 😢");
      return;
    }

    const newCoins = (userData.coins || 0) - price;
    const { error: updateError } = await supabase
      .from("users")
      .update({ coins: newCoins })
      .eq("id", userData.id);

    if (updateError) {
      console.error("Error updating coins:", updateError);
      setModalType("result");
      setModalMessage("Failed to update your coins. 😬");
    } else {
      setUserData((prev) => ({ ...prev, coins: newCoins }));
      setOwnedCostumeIds((prev) => [...prev, costumeId]);
      setModalType("result");
      setModalMessage("Accessory purchased successfully! 🎉");
    }
  }

  const filledCostumes = [...costumes];
  while (filledCostumes.length < 9) {
    filledCostumes.push(null);
  }

  return (
    <div>
      <h3 className="text-xl font-bold text-purple-700 mb-4 text-center">
        🛍️ Store
      </h3>

      <div className="mb-4 text-gray-800 text-center">
        <p className="font-medium">💰 Coins: {userData?.coins || 0}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {filledCostumes.map((costume, index) => (
          <div
            key={index}
            className="border rounded-2xl p-4 shadow-lg flex flex-col items-center min-h-[200px] bg-white transition-transform hover:scale-105 hover:shadow-xl"
          >
            {costume ? (
              <>
                <img
                  src={`/img/costumes/${costume.image_file}`}
                  alt={costume.name}
                  className="w-20 h-20 mb-2 object-contain"
                />
                <div className="font-semibold text-center">{costume.name}</div>
                <div className="text-gray-600 text-sm mb-2">
                  {costume.price} coins
                </div>
                {ownedCostumeIds.includes(costume.id) ? (
                  <div className="text-green-500 font-semibold text-sm mt-auto">
                    ✅ Owned
                  </div>
                ) : (
                  <button
                    onClick={() => handleBuyClick(costume)}
                    className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 text-sm mt-auto"
                  >
                    Buy
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-300 h-full">
                <div className="text-4xl mb-2">🎁</div>
                <div className="text-sm">Coming Soon...</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl p-6 shadow-2xl text-center max-w-xs w-full transform transition-all scale-100 opacity-100">
            <p className="text-gray-800 mb-4">{modalMessage}</p>
            {modalType === "confirm" ? (
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    confirmBuy();
                  }}
                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowModal(false)}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
              >
                OK
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
