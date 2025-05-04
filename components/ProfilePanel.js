import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ProfilePanel({ userData, setUserData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [aliasInput, setAliasInput] = useState(userData?.alias || "");
  const [userCostumes, setUserCostumes] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    if (userData) {
      fetchUserCostumes();
    }
  }, [userData]);

  const fetchUserCostumes = async () => {
    const { data, error } = await supabase
      .from("user_costumes")
      .select("id, equipped, costume_id, costumes(name, image_file, category)")
      .eq("user_id", userData.id);

    if (error) {
      console.error("Error loading user costumes:", error);
    } else {
      setUserCostumes(data || []);
    }
  };

  const handleAliasSave = async () => {
    const trimmed = aliasInput.trim();
    if (!trimmed) return;

    const { data, error } = await supabase
      .from("users")
      .update({ alias: trimmed })
      .eq("id", userData.id)
      .select()
      .single();

    if (error && error.code === "23505") {
      alert("❌ That alias is already taken. Try a different one.");
      return;
    }

    if (!error) {
      setUserData((prev) => ({ ...prev, alias: trimmed }));
      setIsEditing(false);
    }
  };

  const equipCostume = async (userCostumeId) => {
    const { data: targetCostume, error: fetchError } = await supabase
      .from("user_costumes")
      .select("costume_id, costumes(category)")
      .eq("id", userCostumeId)
      .single();

    if (fetchError || !targetCostume?.costumes?.category) {
      console.error("Error fetching costume category:", fetchError);
      return;
    }

    const targetCategory = targetCostume.costumes.category;

    const { data: sameCategoryCostumes } = await supabase
      .from("costumes")
      .select("id")
      .eq("category", targetCategory);

    const sameCategoryIds = sameCategoryCostumes.map((c) => c.id);

    await supabase
      .from("user_costumes")
      .update({ equipped: false })
      .eq("user_id", userData.id)
      .in("costume_id", sameCategoryIds);

    const { error: equipError } = await supabase
      .from("user_costumes")
      .update({ equipped: true })
      .eq("id", userCostumeId);

    if (equipError) {
      console.error("Error equipping costume:", equipError);
      return;
    }

    fetchUserCostumes();
  };

  const unequipCostume = async (userCostumeId) => {
    const { error } = await supabase
      .from("user_costumes")
      .update({ equipped: false })
      .eq("id", userCostumeId);

    if (!error) {
      fetchUserCostumes();
    }
  };

  const groupedByCategory = userCostumes.reduce((acc, item) => {
    const category = item.costumes.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <div>
      <h3 className="text-xl font-bold text-purple-700 mb-4 text-center">
        👤 Profile
      </h3>

      <div className="mb-6">
        {isEditing ? (
          <div className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center">
            <input
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-800 mb-4"
              placeholder="Enter your alias"
            />
            <div className="flex gap-3">
              <button
                onClick={handleAliasSave}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 underline text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-4 flex flex-col items-center">
            <p className="text-gray-700 mb-2">
              <span className="font-medium">Alias:</span>{" "}
              <span className="text-purple-700 font-semibold">
                {userData?.alias || "No alias"}
              </span>
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition text-sm"
            >
              ✏️ Edit Alias
            </button>
          </div>
        )}
      </div>

      <div className="relative w-full h-[620px] flex items-center justify-center mb-6">
        <img
          src="/img/avatar-base.png"
          alt="Your avatar"
          className="h-full max-h-[900px] object-contain z-10"
        />

        {userCostumes
          .filter((item) => item.equipped)
          .map((item) => {
            const { image_file, category } = item.costumes;
            let style = "absolute z-20";
            let extra = "";

            switch (category) {
              case "hat":
                style += " top-0";
                extra = "h-50";
                break;
              case "hand":
                style += " bottom-70 right-[0%]";
                extra = "h-30";
                break;
              case "companion":
                style += " bottom-0 left-0";
                extra = "h-52";
                break;
              default:
                style += " top-0";
                extra = "h-60";
            }

            return (
              <img
                key={item.id}
                src={`/img/costumes/${image_file}`}
                alt={item.costumes.name}
                className={`${style} ${extra}`}
              />
            );
          })}
      </div>

      {/* Collapsible grouped costume sections */}
      <div className="space-y-4">
        {Object.entries(groupedByCategory).map(([category, items]) => (
          <div key={category} className="bg-white rounded-xl shadow p-4">
            <button
              onClick={() =>
                setExpandedCategory((prev) =>
                  prev === category ? null : category
                )
              }
              className="w-full text-left text-md font-bold text-purple-600 mb-2 capitalize"
            >
              {category}s {expandedCategory === category ? "▲" : "▼"}
            </button>

            {expandedCategory === category && (
              <div className="grid grid-cols-2 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col items-center border p-4 rounded-lg shadow-sm bg-white"
                  >
                    <img
                      src={`/img/costumes/${item.costumes.image_file}`}
                      alt={item.costumes.name}
                      className="w-16 h-16 object-contain mb-2"
                    />
                    <p className="text-sm text-gray-700 mb-2">
                      {item.costumes.name}
                    </p>
                    {item.equipped ? (
                      <button
                        onClick={() => unequipCostume(item.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs"
                      >
                        Unequip
                      </button>
                    ) : (
                      <button
                        onClick={() => equipCostume(item.id)}
                        className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 text-xs"
                      >
                        Equip
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
