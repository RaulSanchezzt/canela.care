export default function Store({ userData }) {
  return (
    <div className="">
      <h3 className="text-xl font-bold text-purple-700 mb-4 text-center">
        🛍️ Store
      </h3>

      <div className="mb-4 text-gray-800">
        <p className="font-medium">💰 Coins: {userData?.coins || 0}</p>
      </div>

      {/* Próximamente: mostrar accesorios aquí */}
      <div className="text-sm text-gray-500">Accessories coming soon...</div>
    </div>
  );
}
