import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ProfilePanel({ userData, setUserData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [aliasInput, setAliasInput] = useState(userData?.alias || "");

  const [showHat, setShowHat] = useState(false);

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

  return (
    <div className="">
      <h3 className="text-xl font-bold text-purple-700 mb-4 text-center">
        👤 Profile
      </h3>

      <div className="mb-4">
        {isEditing ? (
          <>
            <input
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              className="w-full px-3 py-2 border rounded text-gray-800"
              placeholder="Your alias"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAliasSave}
                className="bg-purple-600 text-white px-3 py-1 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-sm text-gray-500 underline"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-700 mb-1">
              <span className="font-medium">Alias:</span>{" "}
              {userData?.alias || "No alias"}
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-purple-600 underline"
            >
              ✏️ Edit Alias
            </button>
          </>
        )}
        <div className="relative w-full h-[620px] flex items-center justify-center mb-6">
          {/* Avatar base */}
          <img
            src="/img/avatar-base.png"
            alt="Your avatar"
            className="h-full max-h-[900px] object-contain z-10"
          />

          {/* Accesorios superpuestos */}
          {/* Ejemplo de sombrero */}
          {showHat && (
            <img
              src="/img/costumes/hat1.png"
              alt="Hat"
              className="absolute top-0 z-20 h-60"
            />
          )}
        </div>
      </div>

      {/* Aquí luego podemos añadir accesorios equipados */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setShowHat(!showHat)}
          className="bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition"
        >
          {showHat ? "🧢 Remove Hat" : "🎩 Wear Hat"}
        </button>
      </div>
    </div>
  );
}
